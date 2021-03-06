module.exports = ->
  @loadNpmTasks 'grunt-contrib-compress'

  @config 'compress',
    'chrome-extension':
      options:
        archive: 'chrome-extension/dist/tipsy.zip'
        mode: 'zip'

      files: [
        { src: ['node_modules/purecss/*'], dest: '.' }
        { src: ['**/*'], expand: true, cwd: 'shared' }
        {
          src: [
            'key.pem'
            '_locales/**'
          ]
          expand: true
          cwd: 'chrome-extension'
        }
      ]
