module.exports = (grunt) ->
  grunt.initConfig
    coffee:
      compile:
        files: [
          expand: true
          cwd: 'src'
          src: '**/*.coffee'
          dest: 'lib'
          ext: '.js'
        ]
    coffeelint:
      app: 'src/**/*.coffee'
    watch:
      files: ['Gruntfile.coffee', 'src/**/*.coffee']
      tasks: ['coffeelint', 'coffee']
    nodemon:
      dev:
        options:
          file: 'server.js'
          watchedExtensions: ['js']
    concurrent:
      target:
        tasks: ['watch', 'nodemon']
        options:
          logConcurrentOutput: true


  grunt.loadNpmTasks 'grunt-coffeelint'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-nodemon'
  grunt.loadNpmTasks 'grunt-concurrent'

  grunt.registerTask 'default', ['concurrent:target']

