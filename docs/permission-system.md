# Permission System

## Introduction

SudoBot supports three different types of permission system:

* Discord-based&#x20;
* Level-based
* Permission Roles/Overwrites

This is why we say the bot supports "Hybrid Permission System". Whenever we say "Hybrid" we refer to these three possible permission systems.

## Discord-based Permission System

This is the simplest permission system. When this permission system is enabled on a particular server, the bot will only rely on Discord's permissions. For instance, if someone runs the `ban` command, the bot will check to see if the user has `BanMembers` permission. A member can have this permission if they are the owner/administrator of that server, or if they have a role that explicitly allows the `BanMembers` permission. **This is enabled by default, however it can be customized.**

## Level-based Permission System

In this system, there are permission levels represented by integers, from 0 to 100. Level 0 obviously means no special permission, and 100 means all possible permissions. You can associate users/roles with a particular permission level to allow them to use certain commands or perform certain actions using the bot. The permission levels have predefined set of permissions, however it can be customized/overwritten by adding entries to the `permission_levels` table inside of the bot's database.

{% hint style="warning" %}
Do not add multiple entries with the same level or entries having a value outside of the 0-100 range in the level column. Otherwise the behavior will be undefined.
{% endhint %}

## Permission Roles/Overwrites

This is the most advanced permission system. In this system, you create entries in the `permission_roles` table that describe who will get what permissions, having what role and things like that. This is also merged with Discord's permissions when checking. It makes the entire thing extremely customizable. This system might be suitable if you have a really complex permission structure in your server. Each permission role can have a name, and this does not affect the behavior of the bot.

## How to Configure The Permission System?

To change the permission system or mode, you'll have to edit `config/config.json`. Each server may have a different permission mode.&#x20;

Change the `permissions.mode` (`mode` property inside the `permissions` object) configuration property to one of the following:

* `discord`: Discord-based permission mode (Default)
* `levels`: Level-based permission mode
* `advanced`: Permission Role/Overwrites

And then restart the bot for the changes to take effect.

