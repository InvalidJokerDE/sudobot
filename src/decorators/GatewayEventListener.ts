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

import type { ClientEvents } from "../types/ClientEvents";

export function GatewayEventListener(event: keyof ClientEvents | "raw") {
    return (target: Object, methodName: string, descriptor: TypedPropertyDescriptor<any>) => {
        const metadata = Reflect.getMetadata("event_listeners", target) ?? [];

        metadata.push({
            event,
            handler: descriptor.value,
            methodName
        });

        Reflect.defineMetadata("event_listeners", metadata, target);
    };
}
