const octokit = require('@octokit/rest')()
const inquirer = require('inquirer')
const fs = require('fs-extra')
const path = require('path')
const program = require('commander')
const CONFIG_FILE = path.join(__dirname, './github-pr.json')
 
program
  .version('0.1.0')
  .option('--token [token]', 'initialize github access token')
  .parse(process.argv)

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


async function createPr () {
	try {
		let config = await readConfig()

		if (!config.token) {
			console.warn('Github access token is not initialized')

			return
		}

		let { head, base, title } = await inquirer.prompt([
			{
				type: 'input',
				message: msg('base branch (The branch where your changes are implemented)', 'base', config),
				name: 'base'
			},
			{
				type: 'input',
				message: msg('head branch (The branch you want your changes pulled into)', 'head', config),
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
		  token: config.token
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

		await writeConfig(Object.assign(config, { head, base }))
	} catch (ex) {
		console.warn(ex)
	}
}

async function initToken (token) {
	await writeConfig({ token })
}

if (program.token) {
	initToken(program.token)
} else {
	createPr()
}