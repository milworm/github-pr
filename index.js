const octokit = require('@octokit/rest')()
const inquirer = require('inquirer')
const fs = require('fs-extra')
const path = require('path')

const CONFIG_FILE = path.join(__dirname, './github-pr.json')

function msg(message, key, config) {
	if (config[key])
		message = `${message} (default: ${config[key]})`

	return message
}

async function readConfig () {
	let json = {}

	try {
		json = await fs.readJson(CONFIG_FILE)
	} catch (ex) {
		// file not found
	}

	return json
}

async function writeConfig (config) {
	try {
		await fs.writeJson(CONFIG_FILE, config)
	} catch (ex) {
		console.warn(ex)
	}
}


async function start () {
	try {
		let config = await readConfig()
		let { head, base, title } = await inquirer.prompt([
			{
				type: 'input',
				message: msg('base branch', 'base', config),
				name: 'base'
			},
			{
				type: 'input',
				message: msg('head branch', 'head', config),
				name: 'head'
			},
			{
				type: 'input',
				message: 'title',
				name: 'title'
			}
		])

		octokit.authenticate({
		  type: 'token',
		  token: ''
		})

		let result = await octokit.pullRequests.create({
			owner: 'Didacti',
			repo: 'mainline',
			head: head || config.head,
			base: base || config.base,
			title
		})		

		console.log(result.meta.status)
		console.log(result.data.url)

		await writeConfig({ head, base })
	} catch (ex) {
		console.warn(ex)
	}
}

start()