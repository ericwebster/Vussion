var gulp = require('gulp'); 

// Include Our Plugins
var jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    nodemon = require('gulp-nodemon');

// Lint Task

gulp.task('lint', function() {
    return gulp.src('src/_assets/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// Compile Our Sass - @EW: why? what sass?
//gulp.task('sass', function() {
   // return gulp.src('src/_assets/css/*.scss')
    //    .pipe(sass())
  //      .pipe(gulp.dest('public/_assets/css'));
//});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src([
            'src/_assets/plugins/jquery/*.js',
            'src/_assets/plugins/bootstrap/*.js',
            'src/_assets/plugins/slick/*.js',
            'src/_assets/plugins/socket.io/*.js',
            'src/_assets/plugins/underscore/*.js',
            'src/_assets/plugins/handlebars/*.js',
            'src/_assets/plugins/video.js/*.js'])
        .pipe(concat('all.js'))
        .pipe(gulp.dest('public/_assets/js'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('public/_assets/js'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('src/_assets/js/*.js', ['lint', 'scripts']);
    gulp.watch('src/_assets/css/*.scss', ['sass']);
});

gulp.task('develop', function () {
  nodemon({ script: 'app.js'})
    .on('change', ['lint'])
    .on('restart', function () {
      console.log('restarted!')
    })
    .on('start', function () {
      console.log('nodemon started');
    }).on('crash', function () {
      console.log('script crashed for some reason');
    });
})

// Default Task
gulp.task('default', [/*'lint', 'sass',*/ 'scripts', 'watch','develop']);