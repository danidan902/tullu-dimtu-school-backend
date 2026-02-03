var gulp = require('gulp'),
    gutil = require('gulp-util'),
    jshint = require('gulp-jshint'),
    jshintStylish = require('jshint-stylish'),
    mocha = require('gulp-mocha'),
    complexity = require('gulp-complexity'),
    exec = require('child_process').exec,
    bump = require('gulp-bump'),
    debug = require('gulp-debug'),
    argv = require('minimist')(process.argv.slice(2)),
    freeport = require('freeport'),
    vanilli = require('vanilli');

console.debug = function () {};

gulp.task('complexity', function () {
    return gulp.src('lib/**/*.js')
        .pipe(complexity({
            cyclomatic: [5],
            halstead: [16],
            maintainability: [100]
        }));
});

gulp.task('lint', function () {
    gulp.src(['gulpfile.js', 'lib/**/*.js', 'test/**/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter(jshintStylish))
        .pipe(jshint.reporter('fail'));
});

gulp.task('test', [ 'vanilli-start' ], function () {
    return gulp.src('test/*.js', { read: false })
        .pipe(mocha({
            reporter: 'spec',
            bail: false
        }));
});

gulp.task('bump', function () {
    var packageFile = "./package.json";

    gulp.src(packageFile)
        .pipe(bump({ type: argv.type || 'build'}))
        .pipe(gulp.dest('./'))
        .on('end', function () {
            var newVersion = require(packageFile).version;

            exec('git commit -am "' + newVersion + '"; git tag ' + newVersion + '; git push --tags; git push', {}, function (err, stdout, stderr) {
                if (err) throw err;
                gutil.log(stdout, stderr);
            });
        });
});

gulp.task('vanilli-start', function (cb) {
    freeport(function (err, port) {
        if (err) {
            throw new Error(err);
        } else {
            process.env.vanilliPort = port;
            vanilli.start({ port: port, logLevel: (argv.logLevel || "error") });
            cb();
        }
    });
});

gulp.task('vanilli-stop', [ 'test' ], function () {
    vanilli.stop();
});

gulp.task('default', [ 'lint', 'vanilli-start', 'test', 'vanilli-stop' ]);
