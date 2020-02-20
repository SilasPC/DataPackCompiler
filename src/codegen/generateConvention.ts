import { DataCacheI } from "../toolbox/Cache"
import { Config } from "../api/Configuration"
import { MiscManager } from "./managers/MiscManager"
import fetch from 'node-fetch'

export async function addConvention(
	cache: DataCacheI,
	cfg: Config,
	misc: MiscManager
) {

	if (!cfg.convention.generate) return

	misc.createAbsoluteUnsafe('global','advancements','root',root)

	let icon = await cache.getOrSet('icon',cfg.convention.player,async ()=> await getIcon(cfg.convention.player))

	misc.createAbsoluteUnsafe('global','advancements',cfg.pack.namespace,authorCreate(icon,cfg.author.name))
	misc.createDefault('advancements',['pack'],packCreate(cfg.pack.longName,cfg.convention.icon,cfg.pack.namespace,cfg.pack.description))

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
	let userRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${player}?timestamp=${Date.now()}`)
	if (!userRes.ok) throw new Error('could not find Minecraft player: ' + await userRes.text())
	let user = await userRes.json()
	let dataRes = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${user.id}`)
	if (!dataRes.ok) throw new Error('could not get Minecraft player skin:' + await dataRes.text())
	let data = await dataRes.json()
	return `{SkullOwner:{Name:"${player}",Properties:{textures:[${data.properties.map((p:any)=>`{Value:"${p.value}"}`).join(',')}]}}}`
}

function authorCreate(icon:string,name:string) {
	return JSON.stringify({
			display: {
					title: name,
					description: '',
					icon: {
							item: 'minecraft:player_head',
							nbt: icon
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
