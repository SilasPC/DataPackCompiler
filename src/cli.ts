
import { Command } from 'commander'

const cli = new Command()

cli
	.version('0.1')
	.name('dpc')
	.usage('compile <path>')
	.option('-t --target-version','target minecraft version')
	.option('')
	.command('compile <path>', 'compile file or folder')
	
	.parse(process.argv)
	