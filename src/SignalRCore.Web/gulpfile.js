
/*
This file is the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. https://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var addsrc = require("gulp-add-src");

gulp.task('copy', function () {
    return gulp.src('node_modules/jquery.tabulator/**')
        .pipe(addsrc('jquery.tabulator', { base: '.' })
            .pipe(gulp.dest('wwwroot/lib/jquery.tabulator')));
});

gulp.task('default', ['copy']);
