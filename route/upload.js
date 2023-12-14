/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable consistent-return */
const express = require('express')
const multer = require('multer')
const stream = require('stream')

const router = express.Router()

const httpResp = require('../helper/httpResp')
const config = require('../config/config')
const { connFTP } = require('../helper/ftp')

// FTP configuration
const ftpConfig = config.get('FTP')

// Multer setup
const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post('/image', connFTP, upload.single('file'), async (req, res, next) => {
  const { file } = req
  const originalFilename = file.originalname
  const remotePath = `uploads/images`

  try {
    // Change the working directory
    await req.ftpClient.cd('/')
  } catch (err) {
    console.error(err)
    try {
      // In case Timeout or terminate connection from the FTP Server
      await req.ftpClient.access(ftpConfig)
      await req.ftpClient.cd('/')
    } catch (e) {
      console.error(e)
      delete file.buffer
      res.locals.status = httpResp.HTTP_GENERALERROR
      res.locals.response.rc = httpResp.HTTP_GENERALERROR
      res.locals.response.rd = `ERROR CONNECTION FTP`
      res.locals.response.data = {}
      return next()
    }
  }

  // Create directories if they don't exist
  await req.ftpClient.ensureDir(remotePath)

  // Create a readable stream from the buffer
  const bufferStream = new stream.PassThrough()
  bufferStream.end(file.buffer)

  // Upload the file
  await req.ftpClient.uploadFrom(bufferStream, `/${remotePath}/${originalFilename}`)
  console.log(`File uploaded to directory: /${remotePath}`)
  console.log(`Then add some BASE_URL for access the file that succesed upload`)

  delete file.buffer
  res.locals.status = httpResp.HTTP_CREATED
  res.locals.response.rc = httpResp.HTTP_CREATED
  res.locals.response.rd = `SUCCESS`
  res.locals.response.data = {
    url: `https://BASE_URL/${remotePath}/${originalFilename}`,
    ...file,
  }

  next()
})
module.exports = router
