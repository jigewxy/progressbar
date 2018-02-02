const gulp = require('gulp');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const del = require('del');
const fs = require('fs');
const cleanCss = require('gulp-clean-css');
const concat = require('gulp-concat');
const ngAnnotate = require('gulp-ng-annotate');
const _ = require('lodash');
const foreach = require('gulp-foreach');
const gulpif = require('gulp-if');


var DEST = 'build/',
    nDest = '!build/',
    indexPage = 'index.html';

var jsReg = new RegExp(/\<script\s+src=\"(?!http|\/\/).*script\>/g);
var pathReg = new RegExp(/src=\".*.js/);
var minifyReg = new RegExp(/\.min\.js/);

var fileList =[];

var ngModule=[],
    vendor=[];



//backup index.html and main.html file
gulp.task('backupHtmlFiles', function(){
    
    console.log('create back up directory');
    console.time('====Start====');

    return fs.mkdir('./backups', function(err){

                if(err)
                {
                console.log('skip the backup process as it has been done');
                return;
                }

                else 
                  copyFileSync('./index.html', './backups/index.html');

    });

});

    //MODIFY the index.html based on minified output

 gulp.task('modifyIndexHtml', ['backupHtmlFiles'],()=>{
        
    console.log('modify index.html file');

    //read from ./backup/ to ensure the html file has been backup
    return fs.readFile('./index.html', (err, data)=>{

            if(err)
                throw err;
    
            let str = data.toString();
            
            //var vendorStr = '\n<script src="build/vxxxxx.min.js" type="text/javascript"></script>';
            var ngModuleStr= '\n<script src="build/mxxxxx.min.js" type="text/javascript"></script>';
            var ngCtrlStr = '\n<script src="build/cxxxxx.min.js" type="text/javascript"></script>\n';

            var reg = new RegExp(/\<script.*app\/.*\<\/script\>/g);

         
           // var reg = new RegExp(/app.ctrl.js|main.ctrl.js/g);
            
            var firstMatch = reg.exec(str).index;
            
            // get all the external CDN files
          //  var exception = new RegExp(/\<script\s+src=\"(http|\/\/).*script\>/g);
          //  var exceptionStr = str.match(exception).join('\n');

            str=str.replace(reg, '');

            //insert CDN script, vendor code, global code to the first <script> tag.
            result= str.substring(0, firstMatch) + ngModuleStr+ ngCtrlStr+str.substring(firstMatch);
            
            //remove empty lines
            result=result.replace(/^\s+\n/gm, '');  

            
            fs.writeFile('./index_gulp.html', result, (err)=>{
                
                            if(err)
                                throw err;
                            
                            console.log('index_gulp.html has been generated');
                
                           })
                            
    });

});

/** get the js file list from index.html */
gulp.task('getIndexList', function(){
    
            console.log('get the js list from index.html');
    
            let data =  fs.readFileSync('./index.html');
            let str = data.toString();
            let result = str.match(jsReg);

            console.log(result);
            fileList= extractFileList(result);

            divideMainList(); //divide the list and save the chunks to globals
    
    });

/** minify angular module code */
gulp.task('minifyNgModule', ['getIndexList'], function(){

    console.log('minify the angular module in index.html');
  return   gulp.src(ngModule)
                .pipe(ngAnnotate())
                .pipe(uglify()).on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
                .pipe(concat('mxxxxx.min.js', { newLine: '\n ;' }))
                .pipe(gulp.dest(DEST));

});


/** minify angular controller code */

gulp.task('minifyNgCtrl', ['getIndexList'], function(){
    
    console.log('minify the Ng controller in main.html');
  return   gulp.src(ngCtrl)
                .pipe(ngAnnotate())
                .pipe(uglify()).on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
                .pipe(concat('cxxxxx.min.js', { newLine: '\n ;' }))
                .pipe(gulp.dest(DEST));
});



/** minify vendor code */

gulp.task('minifyVendorCode', ['getIndexList'], function(){

    console.log('minify the Vendor code in index.html');
    
    return   gulp.src(vendor)
                .pipe(gulpif(validateUglifyInput, uglify()))   //skip files already minified
                .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
                .pipe(concat('vxxxxx.min.js', { newLine: '\n ;' }))
                .pipe(gulp.dest(DEST));
    
});
    
    
 //  gulp.task('default',['getIndexList', 'getMainList'], function(){
  gulp.task('default',['backupHtmlFiles',
                        'getIndexList', 
                        'modifyIndexHtml',
                        'minifyNgModule', 
                        'minifyNgCtrl',
                     //   'minifyVendorCode',
                        'cleanUpHtml',
                            ], function(){
        
      console.timeEnd('Overall Time');
    
    })
    

    /** delete the old index.html file */
 gulp.task('cleanUpHtml', ['modifyIndexHtml', 'minifyVendorCode'],function(){

    console.log('final step to clean up the folder');

   return del(['./index.html']).then(function(){

    console.log('Old index.html have been deleted. Backup files can be found in /backup');
   })

 });


/** skip js file which is already minified */
function validateUglifyInput (file){

    if(minifyReg.test(file.path))
        return false;
    else
        return true;
}

    


function copyFileSync(src, dest){
    if(!fs.existsSync(src)){

        return false;
    }

    var data = fs.readFileSync(src, 'utf-8');
    fs.writeFileSync(dest, data);
    console.log('file has been copied to', dest);

}


function extractFileList(match){
    
    let output = [];

    _.each(match, (val)=>{
       
       let temp= val.match(pathReg)[0];
       let i = temp.indexOf('"');
       temp= temp.slice(i+1);
       output.push(temp);

    });

    console.log(output);

    return output;

}


function divideList(args, reg){

        var result = [];
        args.forEach(function(index){

            if(reg.test(index)===true)  //exclude es6 files to avoid error
                result.push(index);

        });

    return result;

}


function divideMainList(){

            ngModule = divideList(fileList, /app.ctrl.js/);
            ngCtrl = divideList(fileList, /main.ctrl.js/);
            vendor = _.uniq(divideList(fileList, /^node_modules\//));  //make sure no duplicate 

    };
