#!/usr/bin/env node

// This file contains the main entry point for the command line `minty` app, and the command line option parsing code.
// See minty.js for the core functionality.

const fs = require('fs/promises')
const path = require('path')
const {Command} = require('commander')
const inquirer = require('inquirer')
const chalk = require('chalk')
const colorize = require('json-colorizer')
const config = require('getconfig')
const {MakeMinty} = require('./minty')

const colorizeOptions = {
    pretty: true,
    colors: {
        STRING_KEY: 'blue.bold',
        STRING_LITERAL: 'green'
    }
}

async function main() {
    const program = new Command()

    // commands
    program
        .command('mint <image-path>')
        .description('create a new NFT from an image file')
        .option('-n, --name <name>', 'The name of the NFT')
        .option('-d, --description <desc>', 'A description of the NFT')
        .action(createNFT)

    program.command('show <token-id>')
        .description('get info about an NFT using its token ID')
        .option('-a, --asset-info', 'fetch asset data from IPFS and returned in assetData (base64 encoded)')
        .action(getNFT)


    program.command('transfer <token-id> <from-address> <to-address>')
        .description('transfer an NFT to a new owner')
        .action(transferNFT)

    program.command('pin <token-id>')
        .description('"pin" the data for an NFT to a remote IPFS Pinning Service')
        .action(pinNFTData)

    // The getconfig module expects to be running from the root directory of the project,
    // so we change the current directory to the parent dir of this script file to make things work
    // even if you call minty from elsewhere
    const rootDir = path.join(__dirname, '..')
    process.chdir(rootDir)

    await program.parseAsync(process.argv)
}

// ---- command action functions

async function createNFT(imagePath, options) {
    const minty = await MakeMinty()

    console.log(colorize(JSON.stringify(options), colorizeOptions))

    // prompt for missing details if not provided as cli args
    const answers = await promptForMissing(options, {
        name: {
            message: 'Enter a name for your new NFT: '
        },

        description: {
            message: 'Enter a description for your new NFT: '
        }
    })

    const nft = await minty.createNFTFromAssetFile(imagePath, answers)
    console.log('🌿 Minted a new NFT: ')

    alignOutput([
        ['Token ID:', chalk.green(nft.tokenId)],
        ['Metadata Address:', chalk.blue(nft.metadataURI)],
        ['Metadata Gateway URL:', chalk.blue(nft.metadataGatewayURL)],
        ['Asset Address:', chalk.blue(nft.assetURI)],
        ['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL)],
    ])
    console.log('NFT Metadata:')
    console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions))
}

async function getNFT(tokenId, options) {
    const { assetInfo: fetchAsset } = options
    console.log(colorize(JSON.stringify(options), colorizeOptions))
    const minty = await MakeMinty()
    const nft = await minty.getNFT(tokenId, {fetchAsset})

    const output = [
        ['Token ID:', chalk.green(nft.tokenId)],
        ['Owner Address:', chalk.yellow(nft.ownerAddress)],
    ]
    output.push(['Metadata Address:', chalk.blue(nft.metadataURI)])
    output.push(['Metadata Gateway URL:', chalk.blue(nft.metadataGatewayURL)])
    output.push(['Asset Address:', chalk.blue(nft.assetURI)])
    output.push(['Asset Gateway URL:', chalk.blue(nft.assetGatewayURL)])
    
    if (nft.assetDataBase64) {
        output.push(['Asset Data Base64:', chalk.yellow(nft.assetDataBase64)])
    }

    alignOutput(output)

    console.log('NFT Metadata:')
    console.log(colorize(JSON.stringify(nft.metadata), colorizeOptions))
}

async function transferNFT(tokenId, fromAddress, toAddress) {
    const minty = await MakeMinty()

    await minty.transferToken(tokenId, fromAddress, toAddress)
    console.log(`🌿 Transferred token ${chalk.green(tokenId)} from ${chalk.yellow(fromAddress)} to ${chalk.yellow(toAddress)}`)
}

async function pinNFTData(tokenId) {
    const minty = await MakeMinty()
    const {assetURI, metadataURI} = await minty.pinTokenData(tokenId)
    console.log(`🌿 Pinned all data for token id ${chalk.green(tokenId)} with URI ${chalk.yellow(assetURI)} and meta data URI ${chalk.yellow(metadataURI)}`)
}

// ---- helpers

async function promptForMissing(cliOptions, prompts) {
    const questions = []
    for (const [name, prompt] of Object.entries(prompts)) {
        prompt.name = name
        prompt.when = (answers) => {
            if (cliOptions[name]) {
                answers[name] = cliOptions[name]
                return false
            }
            return true
        }
        questions.push(prompt)
    }
    return inquirer.prompt(questions)
}

function alignOutput(labelValuePairs) {
    const maxLabelLength = labelValuePairs
      .map(([l, _]) => l.length)
      .reduce((len, max) => len > max ? len : max)
    for (const [label, value] of labelValuePairs) {
        console.log(label.padEnd(maxLabelLength+1), value)
    }
}

// ---- main entry point when running as a script

// make sure we catch all errors
main().then(() => {
    process.exit(0)
}).catch(err => {
    console.error(err)
    process.exit(1)
})
