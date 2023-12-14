/* eslint-disable import/no-extraneous-dependencies */
const FTPClient = require('basic-ftp')
const config = require('../config/config')

const httpResp = require('./httpResp')

// Enable debug logging
FTPClient.verbose = true

// FTP configuration
const ftpConfig = config.get('FTP')
let clientFtp = null

async function connFTP(req, res, next) {
  res.locals.status = httpResp.HTTP_GENERALERROR
  res.locals.response.rc = httpResp.HTTP_GENERALERROR
  res.locals.response.rd = `ERROR CONNECTION FTP`
  res.locals.response.data = {}

  if (!clientFtp) {
    clientFtp = new FTPClient.Client()
    clientFtp.ftp.verbose = true

    // Connect to FTP server
    await clientFtp.access(ftpConfig)
  }
  req.ftpClient = clientFtp
  next()
}

// Function to close FTP connection
async function closeFTP() {
  try {
    if (clientFtp) {
      await clientFtp.close()
      console.log('FTP closed.')
      clientFtp = null // Reset the clientFtp variable
      return { result: 'Close FTP Success' }
    }
    return { result: 'There is no connection FTP' }
  } catch (e) {
    console.error(e)
    throw new Error('Close FTP Failed')
  }
}

module.exports = {
  connFTP,
  closeFTP,
}
