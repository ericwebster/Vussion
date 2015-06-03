

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
        modules: 'loading',
        slide: null
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

      console.log(Vussion.state.current);
      Vussion.registerHandlebarHelpers();
     
      Vussion.resetAllClients();
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
              Vussion.changeSection(el);  //TO REMOVE
              Vussion.mediaPlayer(el, res);  
            });
            
            return false;
          }
        });

      });

      Vussion.socket.on("request state", function(){
        Vussion.sendCurrentState();
      })

    },
    displayDefaultSlide: function() {
      //update all to the module sit slide
      //TODO: set up modules and their defaults
      Vussion.socket.emit('update', Vussion.state.current);
    },
    resetAllClients: function(){
      //check if clients need to be updated
      Vussion.socket.emit('update', Vussion.state.current);
    },
    sendCurrentState:function(){
      Vussion.socket.emit('current state', Vussion.state.current);
    },
    sliderChange: function(slide){
        Vussion.state.current.slide = slide;
        Vussion.socket.emit('change slide', Vussion.state.current.slide);
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
        '<img class="'+ fName +'" src="../../_assets/images/'+ fName +'.png"/> <section  class="media-player">'+
        '<img src="../../_assets/images/loading-icon.gif" /></section></div>'); 
      });

    },
    mediaPlayer: function(modules, res){
      var $mediaPlayerWrapper = '<section class="media-player"></section>';
      $("section").removeClass("active");  
      
        //iterate through model
        var name = modules.name,
        id = modules.id,
        background = modules.background,
        content = modules.content,
        devices = res.devices; //use as default

        //unecessary cleanup?
        $('video').remove();

          $.each(devices, function(i, dev) { // for all devices by default
             var deviceName = dev.name,
              deviceID = dev.id,
              fName = dev.freindlyName;

            // var fName = res.devices[val].freindlyName, //this devices friendly name
            // content = modules.content[0].type, // for this first piece of content
            // sit = modules.content[0].media, //init. loading screen for that module
            // device = $('.'+ fName),
            // playerOptions; // grab class by friendly name

            // playerOptions = { 
            //   controls: false,
            //   autoplay: false,
            //   preload: "auto"
            //   }
            $('.'+fName + ' .media-player').remove();
            $('.'+fName).append($mediaPlayerWrapper);
            
           // device.append('<div class="'+ content +' media-player"><video poster="'+ sit +'" id="player-'+ fName +'" class="video-js vjs-default-skin"'+
           //  'controls preload="auto" webkit-playsinline controls="false" width="" height="auto"'+
           //  '</video></div>'); 
            // need to find the size of the player
           //$('video#player-'+ fName).width(device.width());
          });

          $('.media-player').append('<img class="background" src="'+ background +'" />');

          //build list of modules
            var htmlList = Vussion.compileTemplate("#item-list", modules),
              $listing = $('.video-listing');
              $($listing).html(htmlList).promise().done();
        

            //navigation for modules
            $("#video-selector a").click(function(e){

                var contentNUM = $(this).closest('li').index(),
                devices = modules.content[contentNUM].deviceID,
                sit = modules.content[contentNUM].poster;// use for content index
              e.preventDefault();
              //discern type of media
              if ($(this).hasClass('video')) {
                console.log('video');
               
                $.each($('.media-player'), function(index, val) {
                  var parentDiv = $(this).parent('div'),
                  parentDivID = parentDiv.attr('id');
                });

                $.each(devices, function(index, val) {
                  var source = modules.content[contentNUM].poster,
                  video = modules.content[contentNUM].media,
                  approved = res.devices[val].freindlyName,
                  device = $('.'+ approved);
                  console.log('approved', approved); 
                  //still need to query permissions.
                  device.closest($('.media-player')).empty();
                  modules.videoPlayerID = randomString();
                  device.closest($('.media-player')).append('<video id="player-'+ modules.videoPlayerID +'" poster="'+ source +'" class="video-js vjs-default-skin" preload="auto"> </video>');
                 $('#player-'+ modules.videoPlayerID).width(device.width());
                  
                  Vussion.vidplayer = videojs('#player-' + modules.videoPlayerID);
                  Vussion.videoChange(Vussion.state.current.video); // update the apps!

                  Vussion.vidplayer.src(video).play(function  () {
                     console.log('play');
                   })
                   .on('ended', function(){ 
                   var cleanCallback = function(){
                    console.log('callback');
                   }; 
                   Vussion.cleanupGarbage(cleanCallback);// shows over, go home
                   $('video').remove();
                   $('.media-player').append('<img class="background" src="'+ background +'" />');
                   });
                });
                 // Vussion.state.current.video = $(this).attr("href");
                // console.log(Vussion.state.current.video);
                //Vussion.videoChange(Vussion.state.current.video);
                //fade to default module slide when video ends

              }else if($(this).hasClass('slides')){
              console.log('slides');
              //build list of modules
              var htmlList = Vussion.compileTemplate("#item-list", modules),
              $listing = $('.video-listing');
              $($listing).html(htmlList).promise().done();
        
              // bind all slides
              //navigation for modules
              $("#video-selector a").click(function(e){
                e.preventDefault();
                console.log($(this));
                $.each(devices, function(index, val) {
                  var source = modules.content[contentNUM].poster,
                  video = modules.content[contentNUM].media,
                  approved = res.devices[val].freindlyName,
                  device = $('.'+ approved);
                  console.log('approved', approved, device); 
                  //still need to query permissions.
                  device.closest($('.media-player')).attr('src', video);

                  device.closest($('.media-player')).append('<img src="'+ video  +'"/>');
                 
                });

              });
              }else if($(this).hasClass('html')){
              console.log('html');
              //build list of modules
              var htmlList = Vussion.compileTemplate("#item-list", modules),
              $listing = $('.video-listing');
              $($listing).html(htmlList).promise().done();
              }else{
                console.log('wtf are you?');
              }
               
              });
          
    }
};