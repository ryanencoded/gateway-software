const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const request = require('request')
const zipper = require('zip-local')

class SoftwareManager {
  constructor(options) {
    this.workspace = process.cwd() + '/';
  }

  start() {
    return new Promise(async (resolve, reject) => {
      fs.mkdtemp(path.join(os.tmpdir(), 'starcomm-iot-'), async (err, folder) => {
        if (err) reject(err);
        this.archive = folder + "/";
        await fs.ensureDir(this.archive+'software/');
        resolve(folder);
      });
    })
  }


  backup() {
    return new Promise(async (resolve, reject) => {
      zipper.zip(this.workspace, (error, zipped) => {
          if (error) {reject(error)}
          zipped.compress();
          zipped.save(this.archive + "backup.zip", (error) => {
            if (error) reject(error)
            resolve()
          });
      });
    })
  }

  restore() {
    return new Promise(async (resolve, reject) => {
      zipper.unzip(this.archive + "backup.zip", (error, unzipped) => {
        if (error) reject(error)
        unzipped.save(this.workspace, () => {
          this.finish();
          resolve()
        });
      });
    })
  }

  download(url) {
    return new Promise(async (resolve, reject) => {

      var file = fs.createWriteStream(this.archive + "software.zip");
      request(url)
        .on('error', (error) => {
          fs.unlink(this.archive + "software.zip");
          reject(error);
        })
        .pipe(file)
        .on('close', () => {


          zipper.unzip(this.archive + "software.zip", (error, unzipped) => {
            if (error) reject(error);
            file.close();
            unzipped.save(this.archive + "software/", (err) => {
              if(err) reject(err)
              resolve()
            });
          });
        });
    })
  }


  install() {
    return new Promise(async (resolve, reject) => {
      fs.readdir(this.archive + 'software', (err, files) => {
        if (err) reject(err);

        for(const file of files){

          const oldPath = this.archive + "software/" + file;
          const newPath = this.workspace + file;

          fs.copy(oldPath, newPath, err => {
            if (err) reject(err)
          })
        }

        resolve();
      });

    })
  }


  finish() {
    return new Promise(async (resolve, reject) => {
      fs.remove(this.archive, err => {
        if (err) reject(err)
        resolve();
      })
    })
  }

}

module.exports = SoftwareManager
