

  /*
  Todo's:
    -  when changing sections, presentations are reset. dont know if thats good.
    -  if a user joins after the presentation starts, client does not update until the next emit
    -  there are multiple "slide changes" on each emit, gotta figure that out
  */

  function merge(target, source) {
    /* Merges two (or more) objects,
     giving the last one precedence */
    if ( typeof target !== 'object' ) {
      target = {};
    }
    for (var property in source) {
      if ( source.hasOwnProperty(property) ) {
          var sourceProperty = source[ property ];
          if ( typeof sourceProperty === 'object' ) {
              target[ property ] = util.merge( target[ property ], sourceProperty );
              continue;
          }
          target[ property ] = sourceProperty;
      }
    }
    for (var a = 2, l = arguments.length; a < l; a++) {
      merge(target, arguments[a]);
    }
    return target;
  } 

  function randomString(length, chars) {
    var result = '',
    length = 12,
    chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
  }



  //remote-presetaton
  var Vussion ={
    settings: {
      debug: true,
      pathToAssets: "/",
    },
    state:{
      current:{
        moduleID : 0,
        modules:{
          name: "loading",
          id: 0,
          background: "data/Sit_Slides/live-demo-sit.jpg",
          content:[{
          name:"loading",
          deviceID: [0,1,3],
          type:"default",
          media:"data/Product-Presentation/iPad-1-Phone-Text.mp4",
          poster:"data/Sit_Slides/athena-live-qa-ipad-sit.jpg"
          }]
        }
      }
    },
    init: function(settings){
      if(this.settings.debug){
        console.log('init');
      }
      merge(Vussion.settings, settings);

      Vussion.socket = io();

      $.ajax({
        dataType: "json",
        url: "/data/script.json",
        success: function(res){
          Vussion.data = res;
           Vussion.loadContent(res);
           Vussion.bindEvents(res);
        }
      });

      console.log(Vussion.state.current, 'current state');
      console.log(Vussion.state.current.modules, 'content');

      Vussion.registerHandlebarHelpers();
     
      var defaults = Vussion.state.current.modules.content;//device settings on load
      Vussion.resetAllClients(defaults);
      //Vussion.displayDefaultSlide(defaults);
      //the very first if nothing has happened yet
      Vussion.socket.on("connect", function(){
        Vussion.displayDefaultSlide(defaults);
      })
    },
    bindEvents: function(res){
      //switcher for section
      //this needs to not be a select box :()
      $(".sidebar .dropdown-menu a").on('click', function(e){
        e.preventDefault();
        Vussion.state.current.sectionID = $(this).attr('href');

        _.each(Vussion.data.modules, function(el){
          if(el.id === Vussion.state.current.sectionID){
            Vussion.state.current.modules = el;
            Vussion.cleanupGarbage(function(){
              // Vussion.changeSection(el);  //TO REMOVE
              Vussion.mediaHandler(el, res);  
            });
            
            return false;
          }
        });

      });

      Vussion.socket.on("request state", function(res){
        Vussion.sendCurrentState(res);
      })

    },
    displayDefaultSlide: function(defaults) {
      //update all to the module sit slide
      console.log('defaults', defaults);
      Vussion.socket.emit('default', defaults);
    },
    resetAllClients: function(){
      //check if clients need to be updated
      Vussion.socket.emit('update', Vussion.state.current.modules.content);
    },
    sendCurrentState:function(res){
      console.log('send current res', Vussion.state.current);
      Vussion.socket.emit('current state', Vussion.state.current);
    },
    sliderChange: function(slide){
        Vussion.state.current.slide = slide;
        Vussion.socket.emit('change slide', Vussion.state.current.slide);
    },
    changeSlide: function(num){
      console.log("change slide");
      $("#slider-container").superslides({
        play: 5000
      }); 
    },
    videoChange: function(video){
        Vussion.socket.emit('change video', Vussion.state.current);
    },
    updateClients: function(){
      Vussion.socket.emit('update', Vussion.state.current);
    },
    compileTemplate: function(templateID, data){
      data.settings = Vussion.settings;
      var source   = $(templateID).html();
      var template = Handlebars.compile(source);
      var markup = template(data);
      return markup;
    },
    cleanupGarbage: function(callback){
      if(Vussion.vidplayer){
        // for html5 - clear out the src which solves a browser memory leak
        //  this workaround was found here: http://stackoverflow.com/questions/5170398/ios-safari-memory-leak-when-loading-unloading-html5-video                                         
        if(Vussion.vidplayer.techName == "html5"){        
          Vussion.vidplayer.tag.src = "";                 
          Vussion.vidplayer.tech.removeTriggers();        
          Vussion.vidplayer.load();                       
        }                                                         

        // remove the entire Vussion.vidplayer from the dom
        $(Vussion.vidplayer.el).remove();  

      }
      
      $("section .content").remove();
      callback();
    },
    registerHandlebarHelpers: function(){
      Handlebars.registerHelper('assetPath', function(options) {
        var html = Vussion.settings.pathToAssets + options.fn(this);
        return html;
      });

    },
    changeSection: function(modules){

    },
    loadContent: function(res){
      // init display
      console.log(res); 

      // how many devices?
      $.each(res.devices, function(i, dev) {
        var deviceName = dev.name,
        deviceID = dev.id,
        fName = dev.freindlyName,
        col = (12/res.devices.length);

        //i need a default preview for each screen built
       $('#preview-window').append('<div id="'+ fName +'" class="'+ fName +' col-sm-'+ col +'">'+
        '<h3>'+ deviceName +'</h3>'+
        '<section  class="media-player">'+
        '<img src="../../_assets/images/loading-icon.gif" /></section></div>'); 
      });

    },
    loadDevices: function (defaultVarObj){

      var $mediaPlayerWrapper = '<section class="media-player"></section>';

      $.each(defaultVarObj.devices, function(i, dev) { // for all devices by default
        var fName = dev.freindlyName;

        //adding each default sit slide to the preview area
        $('.'+fName + ' .media-player').remove();
        $('.'+fName).append($mediaPlayerWrapper); 
        
      });

      //all media players created need their background img
      $('.media-player').append('<img class="background" src="'+ defaultVarObj.background +'" />');

    },
    buildSlider: function(defaultVarObj, modules){
      // $('#video-selector').attr('id','slide-list');

    },
    buildModuleNav: function(defaultVarObj, modules){
    //build list of modules
    modules.slidesArr = [];// new array for each subnav
    var htmlList = Vussion.compileTemplate("#item-list", modules),
      $listing = $('.video-listing');
      $($listing).html(htmlList).promise().done(function(){
        Vussion.updateClients();
        //update listing for slide templates
        $.each($('.play-button.slides'), function(index, val) {
           //update the play button for all slide types
           $(this).html('add to slider');
           Vussion.buildSlider(defaultVarObj, modules);

           //added to library ui
           $(this).closest('li').on('click', function(event) {
            if ($(this).closest('li').hasClass('added')) {
              $(this).closest('li')
              .removeClass('added')
              .addClass('removed')
              .css('background', '#fff');

              $(this).find('.play-button').html('removed from slider')
              .css('color','#bccc9e');
              
            }else{
              $(this).find('.play-button').html('added to slider!')
              .css('color','#fff');
              $(this).closest('li')
              .css('background', '#E3F3C4')
              .addClass('added');
             }
           });

        }); 


      });
    },
    videoPlayer: function (defaultVarObj, modules, res){

      var devices = modules.content[defaultVarObj.contentNUM].deviceID,
      contentNUM = defaultVarObj.contentNUM,
      background = modules.background;
      $mediaPlayerWrapper = '<section class="media-player"></section>'; //adjust scope issue

      if (devices == 10) { // our global permission trump number
        return false;
      };
      
      $.each(devices, function(index, val) { //loop only devices with permissions
        
        var source = modules.content[contentNUM].poster,
        video = modules.content[contentNUM].media,
        approved = res.devices[val].freindlyName,
        device = $('.'+ approved);

        console.log('src', video); 

        $('#'+ approved +' .media-player').remove();//clean whats there

        modules.content[contentNUM].playerID = randomString(); //send random string to app
        Vussion.updateClients();// here? please check
        //build
        device.append($mediaPlayerWrapper);
        $('#'+ approved +' .media-player').append('<video id="player-'+ modules.content[contentNUM].playerID +'" poster="'+ source +'" class="video-js vjs-default-skin" preload="auto"> </video>');
        $('#player-'+ modules.content[contentNUM].playerID).width(device.width());
        
        Vussion.vidplayer = videojs('#player-' + modules.content[contentNUM].playerID);
         
        Vussion.videoChange(Vussion.state.current.video); // update the apps! -TO DELETE
        Vussion.updateClients();// new global update
        
        Vussion.vidplayer.src(video).play(function  () {
           console.log('play');
         })
         .on('ended', function(){ 
         var cleanCallback = function(){
          console.log('callback');
          $('#'+ approved +' .media-player').empty();
        }; 
        Vussion.cleanupGarbage(cleanCallback);// shows over, go home
         
        $('#'+ approved +' .media-player').append('<img class="background" src="'+ background +'" />');

        });

      }); 
    },
    slide: function (defaultVarObj, modules, res){
      var devices = modules.content[defaultVarObj.contentNUM].deviceID,
      contentNUM = defaultVarObj.contentNUM,
      $mediaPlayerWrapper = '<section class="media-player"></section>'; //adjust scope issue

      console.log('slideArr',modules.slidesArr);   

      Vussion.updateClients();//global update //looks OUT OF PLACE
      console.log(devices, 'slide devices');

      if (devices == 10) { // our global permission trump number
        return false;
      };

      //build first slide

      $.each(devices, function(index, val) {
        var source = modules.content[contentNUM].poster,
        video = modules.content[contentNUM].media,
        approved = res.devices[val].freindlyName,
        device = $('.'+ approved),
        $deviceElId = $('#'+ approved +' .media-player');

        console.log('approved', approved, device); 
        //still need to query permissions.

        console.log('img src', video, contentNUM);
       // device.closest($('.media-player')).attr('src', video);
        $deviceElId.empty();//clean
        $deviceElId.append('<img src="'+ video  +'"/>');
       
      // if (modules.slidesArr.length > 1) {
      //   $('#'+ approved +' .media-player img').remove(); //clean what was there
      //   //need slide template
      //   $deviceElId.append('<div class="content"><div id="slider-container" class="slides non-interactive"><div class="slides-container no-bs"></div></div></div>');
            
      //   //new array to step through
      //   $.each(modules.slidesArr, function(index, val) {
      //     $('.slides-container').append('<img src="'+ val +'" width="1024" height="768"/>'); 
      //   });
        
      //    Vussion.changeSlide();
      //   }
      });


      Vussion.updateClients(); //redundant
    },
    moduleSubNav: function(defaultVarObj, modules, res){
    //navigation for modules
    modules.slidesArr = [];// new array for each subnav

      $("#video-selector li").click(function(e){
        e.preventDefault();
               
        var contentNUM = $(this).index(),//used to GET content index
        devices = modules.content[contentNUM].deviceID,
        sit = modules.content[contentNUM].poster;

        //globalobj needs update
        defaultVarObj.contentNUM = $(this).index();//used to GET content index

        Vussion.state.current.moduleID = contentNUM; //add param for the app

        Vussion.updateClients();
        //discern type of media
        if ($(this).find('a').hasClass('video')) {
          console.log('video');
          
          //video handler
          Vussion.videoPlayer(defaultVarObj, modules, res);     
        
        }else if($(this).find('a').hasClass('slides')){
        console.log('slides');

        //check if slide is there
        console.log(sit, "sit", modules.slidesArr, 'in');
        perm = $.inArray(sit, modules.slidesArr );
        console.log(perm);
        if(perm  <= -1){
        //let's collect clicks // build slide library
          modules.slidesArr.push(sit);
        }

        //if removed
        $('.removed').on('click', function(){
              //okay-actually remove from slider
              console.log('remove sit', sit);
              for (var i=modules.slidesArr.length-1; i>=0; i--) {
                  if (modules.slidesArr[i] == sit) {
                      modules.slidesArr.splice(i, 1);
                  }
              }
              Vussion.updateClients();//global update 
        });


        //slide [individual] handler init
        Vussion.slide(defaultVarObj, modules, res);

        }else if($(this).find('a').hasClass('html')){
        console.log('html');
        //build list of modules
        var htmlList = Vussion.compileTemplate("#item-list", modules),
        $listing = $('.video-listing');
        $($listing).html(htmlList).promise().done();
        }else{
          console.log('wtf are you?');
        }
               
      });
    },
    mediaHandler: function(modules, res){
      var $mediaPlayerWrapper = '<section class="media-player"></section>';
      $("section").removeClass("active");  

        defaultVarObj = { //for cleanup
          name : modules.name,
          id : modules.id,
          background : modules.background,
          content : modules.content,
          devices : res.devices
        };

        Vussion.loadDevices(defaultVarObj); //reset the background for each device

        Vussion.buildModuleNav(defaultVarObj, modules);//build navigation for this module selected

        Vussion.moduleSubNav(defaultVarObj, modules, res);// scroll nav for slides and video  
    }
};