/*
 * This file is part of SudoBot.
 *
 * Copyright (C) 2021-2023 OSN Developers.
 *
 * SudoBot is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * SudoBot is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with SudoBot. If not, see <https://www.gnu.org/licenses/>.
 */

import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { Action } from "../../decorators/Action";
import { Validate } from "../../decorators/Validate";
import { zSnowflake } from "../../types/SnowflakeSchema";
import { logError } from "../../utils/logger";
import Controller from "../Controller";
import Request from "../Request";
import Response from "../Response";

const showInfoSchema = z.object({
    token: z.string(),
    userId: zSnowflake
});

export default class VerificationController extends Controller {
    @Action("GET", "/challenge/verify")
    async showInfo(request: Request) {
        const parsed = showInfoSchema.safeParse(request.query);

        if (!parsed.success) {
            return new Response({
                status: 422,
                body: "Invalid Payload"
            });
        }

        const { token, userId } = parsed.data;

        const info = await this.client.prisma.verificationEntry.findFirst({
            where: {
                userId,
                token
            }
        });

        const guild = this.client.guilds.cache.get(info?.guildId!);

        if (!info || !guild) {
            return new Response({
                status: 404,
                body: {
                    error: "Not found"
                }
            });
        }

        return {
            ...info,
            guildName: guild.name,
            icon: guild.icon
        };
    }

    @Action("PUT", "/challenge/verify/email/initiate")
    @Validate(
        z.object({
            verificationToken: z.string(),
            email: z.string().email(),
            userId: zSnowflake
        })
    )
    async verifyByEmail(request: Request) {
        const { email, verificationToken, userId } = request.parsedBody;
        const key = request.headers["x-frontend-key"];

        if (key !== process.env.FRONTEND_AUTH_KEY) {
            return new Response({
                status: 401,
                body: {
                    error: "Unauthorized"
                }
            });
        }

        const entry = await this.client.prisma.verificationEntry.findFirst({
            where: {
                userId,
                token: verificationToken
            }
        });

        if (!entry) {
            return new Response({
                status: 401,
                body: {
                    error: "Unauthorized"
                }
            });
        }

        const config = this.client.configManager.config[entry.guildId!]?.verification;
        const seed = await bcrypt.hash((Math.random() * 100000000).toString(), await bcrypt.genSalt());
        const emailVerificationToken = jwt.sign(
            {
                seed,
                userId: entry.userId,
                email
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: config?.max_time === 0 ? undefined : config?.max_time,
                issuer: `SudoBot`,
                subject: "Email Verification Token"
            }
        );

        await this.client.prisma.verificationEntry.update({
            where: {
                id: entry.id
            },
            data: {
                meta: {
                    email,
                    emailVerificationToken
                }
            }
        });

        return {
            success: true,
            data: {
                ...entry,
                guildName: this.client.guilds.cache.get(entry.guildId)?.name,
                meta: {
                    email,
                    emailVerificationToken
                }
            }
        };
    }

    @Action("POST", "/challenge/verify/captcha")
    @Validate(
        z.object({
            responseToken: z.string(),
            verificationToken: z.string(),
            userId: zSnowflake
        })
    )
    async verifyByCaptcha(request: Request) {
        const { responseToken, verificationToken, userId } = request.parsedBody;

        try {
            const response = await axios.post(
                "https://www.google.com/recaptcha/api/siteverify",
                new URLSearchParams({
                    secret: process.env.RECAPTCHA_SITE_SECRET!,
                    response: responseToken
                }).toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }
            );

            if (!response.data.success) {
                throw new Error();
            }
        } catch (error) {
            logError(error);

            return new Response({
                status: 401,
                body: {
                    success: false,
                    error: "We were unable to verify you."
                }
            });
        }

        const result = await this.client.verification.attemptToVerifyUserByToken(userId, verificationToken);

        if (!result) {
            return new Response({
                status: 401,
                body: {
                    success: false,
                    error: "We were unable to verify you."
                }
            });
        }

        return {
            success: true
        };
    }
}
