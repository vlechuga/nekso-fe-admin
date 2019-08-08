// Generated on 2015-11-11 using generator-angular 0.12.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  // Time how long tasks take. Can help when optimizing build times
  require('time-grunt')(grunt);

  // Automatically load required Grunt tasks
  require('jit-grunt')(grunt, {
    useminPrepare: 'grunt-usemin',
    ngtemplates: 'grunt-angular-templates',
    cdnify: 'grunt-google-cdn'
  });

  // Configurable paths for the application
  var appConfig = {
    app: require('./bower.json').appPath || 'app',
    dist: 'dist'
  };

  //Load grunt ng-constant
  grunt.loadNpmTasks('grunt-ng-constant');

  //Load grunt-postcss
  grunt.loadNpmTasks('grunt-postcss');

  // Define the configuration for all the tasks
  grunt.initConfig({

    // Project settings
    yeoman: appConfig,

    // Watches files for changes and runs tasks based on the changed files
    watch: {
      options: {
        livereload: true
      },
      bower: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },
      js: {
        files: ['<%= yeoman.app %>/scripts/{,*/,**/}*.js'],
        tasks: ['newer:jshint:all'],
        options: {
          livereload: '<%= connect.options.livereload %>'
        }
      },
      jsTest: {
        files: ['test/spec/{,*/}*.js'],
        tasks: ['newer:jshint:test', 'karma']
      },
      sass: {
        files: ['<%= yeoman.app %>/styles/{,*/,**/}*.{scss,sass}'],
        tasks: ['sass:server', 'postcss']
      },
      gruntfile: {
        files: ['Gruntfile.js']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '<%= yeoman.app %>/{,*/,**/}*.html',
          '.tmp/styles/{,*/}*.css',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ]
      }
    },

    // The actual grunt server settings
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect().use(
                '/app/styles',
                connect.static('./app/styles')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          port: 9001,
          middleware: function (connect) {
            return [
              connect.static('.tmp'),
              connect.static('test'),
              connect().use(
                '/bower_components',
                connect.static('./bower_components')
              ),
              connect.static(appConfig.app)
            ];
          }
        }
      },
      dist: {
        options: {
          open: true,
          base: '<%= yeoman.dist %>'
        }
      }
    },

    // Make sure code styles are up to par and there are no obvious mistakes
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: require('jshint-stylish')
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= yeoman.app %>/scripts/{,*/}*.js'
        ]
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/spec/{,*/}*.js']
      }
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/{,*/}*',
            '!<%= yeoman.dist %>/.git{,*/}*'
          ]
        }]
      },
      server: '.tmp'
    },

    // Add vendor prefixed styles
    postcss: {
      options: {
        map: true,
        processors: [
          require('autoprefixer')({
            browsers: ['last 2 versions']
          })
        ]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/styles/',
          src: '{,*/}*.css',
          dest: '.tmp/styles/'
        }]
      }
    },

    // Automatically inject Bower components into the app
    wiredep: {
      app: {
        src: ['<%= yeoman.app %>/index.html'],
        ignorePath:  /\.\.\//
      },
      test: {
        devDependencies: true,
        src: '<%= karma.unit.configFile %>',
        ignorePath:  /\.\.\//,
        fileTypes:{
          js: {
            block: /(([\s\t]*)\/{2}\s*?bower:\s*?(\S*))(\n|\r|.)*?(\/{2}\s*endbower)/gi,
              detect: {
                js: /'(.*\.js)'/gi
              },
              replace: {
                js: '\'{{filePath}}\','
              }
            }
          }
      },
      sass: {
        src: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
        ignorePath: /(\.\.\/){1,2}bower_components\//
      }
    },

    // Compiles Sass to CSS and generates necessary files if requested
    sass: {
      options: {
        includePaths: [
          'bower_components'
        ]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/styles',
          src: ['*.scss'],
          dest: '.tmp/styles',
          ext: '.css'
        }]
      },
      server: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/styles',
          src: ['*.scss'],
          dest: '.tmp/styles',
          ext: '.css'
        }]
      }
    },

    // Renames files for browser caching purposes
    filerev: {
      dist: {
        src: [
          '<%= yeoman.dist %>/scripts/{,*/}*.js',
          '<%= yeoman.dist %>/styles/{,*/}*.css',
          // '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= yeoman.dist %>/styles/fonts/*'
        ]
      }
    },

    // Reads HTML for usemin blocks to enable smart builds that automatically
    // concat, minify and revision files. Creates configurations in memory so
    // additional tasks can operate on them
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>',
        flow: {
          html: {
            steps: {
              js: ['concat', 'uglifyjs'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },

    // Performs rewrites based on filerev and the useminPrepare configuration
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      js: ['<%= yeoman.dist %>/scripts/{,*/}*.js'],
      options: {
        assetsDirs: [
          '<%= yeoman.dist %>',
          '<%= yeoman.dist %>/images',
          '<%= yeoman.dist %>/styles'
        ],
        patterns: {
          js: [[/(images\/[^''""]*\.(png|jpg|jpeg|gif|webp|svg))/g, 'Replacing references to images']]
        }
      }
    },

    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    svgmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.svg',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },

    htmlmin: {
      dist: {
        options: {
          collapseWhitespace: true,
          conservativeCollapse: true,
          collapseBooleanAttributes: true,
          removeCommentsFromCDATA: true
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>',
          src: ['*.html'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },

    ngtemplates: {
      dist: {
        options: {
          module: 'neksoFeAdmindashboardApp',
          htmlmin: '<%= htmlmin.dist.options %>',
          usemin: 'scripts/scripts.js'
        },
        cwd: '<%= yeoman.app %>',
        src: 'views/{,**/}*.html',
        dest: '.tmp/templateCache.js'
      }
    },

    // ng-annotate tries to make the code safe for minification automatically
    // by using the Angular long form for dependency injection.
    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '.tmp/concat/scripts',
          src: '*.js',
          dest: '.tmp/concat/scripts'
        }]
      }
    },

    // Replace Google CDN references
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },

    // Copies remaining files to places other tasks can use
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'views/**/*.html',
            'images/{,*/}*.{webp}',
            'styles/fonts/{,*/}*.*'
          ]
        }, {
          expand: true,
          cwd: '.tmp/images',
          dest: '<%= yeoman.dist %>/images',
          src: ['generated/*']
        }, {
          expand: true,
          cwd: 'bower_components/bootstrap/dist',
          src: 'fonts/*',
          dest: '<%= yeoman.dist %>'
        }, {
          expand: true,
          cwd: 'bower_components/components-font-awesome',
          src: 'fonts/*',
          dest: '<%= yeoman.dist %>'
        }]
      },
      styles: {
        expand: true,
        cwd: '<%= yeoman.app %>/styles',
        dest: '.tmp/styles/',
        src: '{,*/}*.css'
      },
      imagesO: {
        expand: true,
        dot: true,
        cwd: '<%= yeoman.app %>',
        dest: '<%= yeoman.dist %>',
        src: 'images/{,**/}*.*'
      },
      multiselectIcon: {
        expand: true,
        dot: true,
        cwd: '<%= yeoman.app %>',
        dest: '<%= yeoman.dist %>',
        src: 'images/sprites/multiple-select.png'
      },
      gmapsHeatmapScript: {
        expand: true,
        dot: true,
        cwd: '<%= yeoman.app %>',
        dest: '<%= yeoman.dist %>',
        src: 'scripts/gmaps-heatmap.js'
      }
    },

    // Run some tasks in parallel to speed up the build process
    concurrent: {
      server: [
        'sass:server',
        'copy:styles'
      ],
      test: [
        'sass',
        'copy:styles'
      ],
      dist: [
        'sass',
        'copy:styles',
        'imagemin',
        'svgmin'
      ]
    },

    // Test settings
    karma: {
      unit: {
        configFile: 'test/karma.conf.js',
        singleRun: true
      }
    },

    //ng-constant
    ngconstant: {
      options: {
        name: 'config',
        dest: '.tmp/scripts/config.js'
      },
      dev: {
        constants: {
          API_BASE_PATH: 'https://api-dev.nekso.io/v1/',
          GOOGLE_API_KEY: 'AIzaSyDynT53OB1ERPxHbKGhYb2R1OfH3G4bLjg',
          GOOGLE_API_SERVER_KEY: 'AIzaSyCyzketynaDewtyAdS2v8aYzr7jOXyD-Qg',
          AMAZONAWS_API_KEY: 'Ld90MWtm5d7KrQ5Kh0qbd1O9hOOVb2nN18iYMbW3',
          AMAZONAWS_API_URL: 'https://e9lhfc1j3k.execute-api.us-west-2.amazonaws.com/dev/',
          MQTT: {
            BASE_PATH: 'mqtt-dev.nekso.io',
            BASE_PORT: 9004,
            USE_AUTH: true,
            USE_SSL: true,
            USER: 'CONTROLLER',
            PASSWORD: 'CONTROLLER'
          },
          SHARE_PROMOTION_PATH: {
            EN: 'https://www-dev.nekso.io/r/u/',
            ES: 'https://www-dev.nekso.io/r/p/'
          }
        }
      },
      local: {
        constants: {
          GOOGLE_API_KEY: '',
          API_BASE_PATH: 'http://localhost:8080/v1/',
          GOOGLE_API_SERVER_KEY: '',
          AMAZONAWS_API_KEY: 'Ld90MWtm5d7KrQ5Kh0qbd1O9hOOVb2nN18iYMbW3',
          AMAZONAWS_API_URL: 'https://e9lhfc1j3k.execute-api.us-west-2.amazonaws.com/dev/',
          MQTT: {
            BASE_PATH: 'mqtt-dev.nekso.io',
            BASE_PORT: 9004,
            USE_AUTH: true,
            USE_SSL: true,
            USER: 'CONTROLLER',
            PASSWORD: 'CONTROLLER'
          },
          SHARE_PROMOTION_PATH: {
            EN: 'https://www-dev.nekso.io/r/u/',
            ES: 'https://www-dev.nekso.io/r/p/'
          }
        }
      },
      prod: {
        constants: {
          API_BASE_PATH: 'https://api.nekso.io/v1/',
          GOOGLE_API_KEY: 'AIzaSyAbaFr-fJi-OwYM5Gnrn0FGoOrttw8hYRc',
          GOOGLE_API_SERVER_KEY: 'AIzaSyAbaFr-fJi-OwYM5Gnrn0FGoOrttw8hYRc',
          AMAZONAWS_API_KEY: 'Ld90MWtm5d7KrQ5Kh0qbd1O9hOOVb2nN18iYMbW3',
          AMAZONAWS_API_URL: 'https://e9lhfc1j3k.execute-api.us-west-2.amazonaws.com/prod/',
          MQTT:{
            BASE_PATH: 'mqtt.nekso.io',
            BASE_PORT: 9002,
            USE_AUTH: true,
            USE_SSL: true,
            USER: 'CONTROLLER',
            PASSWORD: 'CONTROLLER'
          },
          SHARE_PROMOTION_PATH: {
            EN: 'https://nekso.io/r/u/',
            ES: 'https://nekso.io/r/p/'
          }
        }
      },
      proddev: {
        constants: {
          API_BASE_PATH: 'https://api.nekso.io/v1/',
          GOOGLE_API_KEY: '',
          GOOGLE_API_SERVER_KEY: 'AIzaSyCyzketynaDewtyAdS2v8aYzr7jOXyD-Qg',
          AMAZONAWS_API_KEY: 'Ld90MWtm5d7KrQ5Kh0qbd1O9hOOVb2nN18iYMbW3',
          AMAZONAWS_API_URL: 'https://e9lhfc1j3k.execute-api.us-west-2.amazonaws.com/prod/',
          MQTT:{
            BASE_PATH: 'mqtt.nekso.io',
            BASE_PORT: 9002,
            USE_AUTH: true,
            USE_SSL: true,
            USER: 'CONTROLLER',
            PASSWORD: 'CONTROLLER'
          },
          SHARE_PROMOTION_PATH: {
            EN: 'https://nekso.io/r/u/',
            ES: 'https://nekso.io/r/p/'
          }
        }
      },
      qadev: {
        constants: {
          API_BASE_PATH: 'https://api-qa.nekso.io/v1/',
          GOOGLE_API_KEY: '',
          GOOGLE_API_SERVER_KEY: 'AIzaSyCyzketynaDewtyAdS2v8aYzr7jOXyD-Qg',
          AMAZONAWS_API_KEY: 'Ld90MWtm5d7KrQ5Kh0qbd1O9hOOVb2nN18iYMbW3',
          AMAZONAWS_API_URL: 'https://e9lhfc1j3k.execute-api.us-west-2.amazonaws.com/dev/',
          MQTT:{
            BASE_PATH: 'mqtt-qa.nekso.io',
            BASE_PORT: 9003,
            USE_AUTH: true,
            USE_SSL: true,
            USER: 'CONTROLLER',
            PASSWORD: 'CONTROLLER'
          },
          SHARE_PROMOTION_PATH: {
            EN: 'https://nekso.io/r/u/',
            ES: 'https://nekso.io/r/p/'
          }
        }
      },
      qa: {
        constants: {
          API_BASE_PATH: 'https://api-qa.nekso.io/v1/',
          GOOGLE_API_KEY: 'AIzaSyDynT53OB1ERPxHbKGhYb2R1OfH3G4bLjg',
          GOOGLE_API_SERVER_KEY: 'AIzaSyCyzketynaDewtyAdS2v8aYzr7jOXyD-Qg',
          AMAZONAWS_API_KEY: 'Ld90MWtm5d7KrQ5Kh0qbd1O9hOOVb2nN18iYMbW3',
          AMAZONAWS_API_URL: 'https://e9lhfc1j3k.execute-api.us-west-2.amazonaws.com/dev/',
          MQTT:{
            BASE_PATH: 'mqtt-qa.nekso.io',
            BASE_PORT: 9003,
            USE_AUTH: true,
            USE_SSL: true,
            USER: 'CONTROLLER',
            PASSWORD: 'CONTROLLER'
          },
          SHARE_PROMOTION_PATH: {
            EN: 'https://www-qa.nekso.io/r/u/',
            ES: 'https://www-qa.nekso.io/r/p/'
          }
        }
      }
    }
  });


  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'ngconstant:local',
      'wiredep',
      'concurrent:server',
      'postcss',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('serve-dev', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'ngconstant:dev',
      'wiredep',
      'concurrent:server',
      'postcss',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('serve-qa', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'ngconstant:qadev',
      'wiredep',
      'concurrent:server',
      'postcss',
      'connect:livereload',
      'watch'
    ]);
  });
  grunt.registerTask('serve-prod', 'Compile then start a connect web server', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'ngconstant:proddev',
      'wiredep',
      'concurrent:server',
      'postcss',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', 'DEPRECATED TASK. Use the "serve" task instead', function (target) {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve:' + target]);
  });

  grunt.registerTask('test', [
    'clean:server',
    'ngconstant:dev',
    'wiredep',
    'concurrent:test',
    'postcss',
    'connect:test',
    'karma'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'ngconstant:dev',
    'wiredep',
    'useminPrepare',
    'concurrent:dist',
    'postcss',
    'concat',
    'ngAnnotate',
    'copy:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'filerev',
    'usemin',
    'htmlmin',
    'copy:imagesO',
    'copy:multiselectIcon',
    'copy:gmapsHeatmapScript'
  ]);

  grunt.registerTask('build-prod', [
    'clean:dist',
    'ngconstant:prod',
    'wiredep',
    'useminPrepare',
    'concurrent:dist',
    'postcss',
    'concat',
    'ngAnnotate',
    'copy:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'filerev',
    'usemin',
    'htmlmin',
    'copy:imagesO',
    'copy:multiselectIcon',
    'copy:gmapsHeatmapScript'
  ]);

  grunt.registerTask('build-qa', [
    'clean:dist',
    'ngconstant:qa',
    'wiredep',
    'useminPrepare',
    'concurrent:dist',
    'postcss',
    'concat',
    'ngAnnotate',
    'copy:dist',
    'cdnify',
    'cssmin',
    'uglify',
    'filerev',
    'usemin',
    'htmlmin',
    'copy:imagesO',
    'copy:multiselectIcon',
    'copy:gmapsHeatmapScript'
  ]);

  grunt.registerTask('default', [
    'newer:jshint',
    'test',
    'build'
  ]);
};
