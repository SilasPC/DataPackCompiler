import { MKDIRP } from "./fsHelpers";
import { join } from "path";
import { promises as fs } from 'fs'

import fetch from 'node-fetch'
import { Config } from "../api/Configuration";

export async function emitConvention(
    cfg: Config,
    dataFolder:string
) {

    let globalNs = join(dataFolder,'global/advancements')
    let packNs = join(dataFolder,cfg.pack.namespace,'advancements')

    await MKDIRP(globalNs)
    await MKDIRP(packNs)

    await fs.writeFile(join(globalNs,'root.json'),root)
    await fs.writeFile(join(globalNs,cfg.pack.namespace+'.json'),await authorCreate(cfg.author.name,cfg.author.player))
    await fs.writeFile(join(packNs,'_pack.json'),packCreate(cfg.pack.longName,cfg.pack.icon,cfg.pack.namespace,cfg.pack.description))

}

function packCreate(title:string,item:string,namespace:string,description:string) {
    return JSON.stringify({
        display: {
          title,
          description,
          icon: {
            item
          },
          background: "minecraft:textures/block/black_concrete_powder.png",
          show_toast: false,
          announce_to_chat: false
        },
        parent: 'global:'+namespace,
        criteria: {
          trigger: {
            trigger: "minecraft:tick"
          }
        }
      },null,2)
}

async function getIcon(player:string) {
    let userRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${player}`)
    if (!userRes.ok) throw new Error('could not find Minecraft player')
    let user = await userRes.json()
    let dataRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${user.id}`)
    if (!dataRes.ok) throw new Error('could not get Minecraft player skin')
    let data = await dataRes.json()
    return `{SkullOwner:{Name:"${player}",Properties:{textures:[${data.properties.map((p:any)=>`{Value:"${p.value}"}`).join(',')}]}}}`
}

async function authorCreate(name:string,player:string) {
    return JSON.stringify({
        display: {
            title: name,
            description: '',
            icon: {
                item: 'minecraft:player_head',
                nbt: await getIcon(player)
            },
            background: 'minecraft:textures/block/black_concrete_powder.png',
            show_toast: false,
            announce_to_chat: false
        },
        parent: 'global:root',
        criteria: {
            'trigger': {
                'trigger': 'minecraft:tick'
            }
        }
    },null,2)
}

const root = JSON.stringify({
    "display": {
        "title": "Installed Datapacks",
        "description": "",
        "icon": {
            "item": "minecraft:knowledge_book"
        },
        "background": "minecraft:textures/block/black_concrete_powder.png",
        "show_toast": false,
        "announce_to_chat": false
    },
    "criteria": {
        "trigger": {
            "trigger": "minecraft:tick"
        }
    }
},null,2)
