

  /*
  Todo's:
    -  when changing sections, presentations are reset. dont know if thats good.
  */


  //remote-presetaton
  var Vussion = {
    settings: {
      debug: true,
      pathToAssets: '',
      server: '192.168.1.160',
      port:'8080',
      role:0 //ipad
    },
    state:{
      current:{
        modules: 'loading',
        content:{
          type: 'default',
          media:'/'
        },
        slide: 0,
        type:'default'
      }
    },
    init: function(settings){
      this.debugLog('init');
      merge(Vussion.settings, settings);
      $("#loading p").text("Connecting to Server ..")
      this.data = ExternalData;
      if(window.localStorage.getItem('settings')){
        this.debugLog("found local settings");
        this.getSettingsFromLocalStorage();
        this.debugLog("connect to >> " + this.settings.server + ":" + this.settings.port);
      } else {
        this.debugLog("no local settings");
      }
      this.debugLog("connecting.." + "http://"+ this.settings.server + ":" + this.settings.port);
      this.socket = io("http://"+ this.settings.server + ":" + this.settings.port);
      this.registerHandlebarHelpers();
      this.bindEvents();
    },
    bindEvents: function(){
      Vussion.socket.on('connect', function(defaults){

        Vussion.debugLog("socket.on >> we're connected captain, engage");

        //have the client machine request the current state of the presentation
        Vussion.debugLog("socket.on >> requested state");
        Vussion.socket.emit("request state");


        //this should trigger a current state emit from the server
        Vussion.socket.on('current state', function(res){
          
          Vussion.debugLog("socket.on >> loading current state");
          Vussion.debugLog('from here', res);
          Vussion.state.current = res;
          console.log('res resp', res);
          resID = Vussion.state.current.moduleID;

          console.log(resID);
          Vussion.changeSection(res.modules, resID); //DC
        })


        //this is the main modules change update, possibly rename todo:
        Vussion.socket.on('update', function(res){
          Vussion.debugLog("socket.on >> update")
            console.log('res id', res.modules.id, 'current', Vussion.state.current.modules.id);
          if(res.modules.id != Vussion.state.current.id){
            //modules has changed
            Vussion.debugLog("socket.on >> modules change");
            Vussion.debugLog(res);

          Vussion.state.current = res;
          console.log('res resp', res);
          resID = Vussion.state.current.moduleID;

          console.log(resID);
          Vussion.changeSection(res.modules, resID); //DC
          }

        });


        Vussion.socket.on('change slide', function(res){
          Vussion.debugLog("socket.on >> slide change");
          Vussion.debugLog("new slide >> " + res);
          //todo: check if current slide is the one being animated to
           Vussion.state.current = res;
          console.log('res resp', res);
          resID = Vussion.state.current.moduleID;

          console.log(resID);
          Vussion.changeSection(res.modules, resID); //DC
          
        }); 


        Vussion.socket.on('change video', function(res){
            console.log('res-vid-change', res);
            // Vussion.debugLog("video change");
            // Vussion.state.current.video = state.video;
            // Vussion.playVideo();
              Vussion.state.current = res;
          console.log('res resp', res);
          resID = Vussion.state.current.moduleID;

          console.log(resID);
          Vussion.changeSection(res.modules, resID); //DC
        }); 
      })
      Vussion.socket.on('error', function(err){
        Vussion.debugLog("socket.on >> Oh-oh error on io.connect");
        Vussion.debugLog("Settings >>");
        Vussion.debugLog(Vussion.settings);
        Vussion.debugLog("Err OBJ >>");
        Vussion.debugLog(err);
      })

      //this is the bind for the settings form, on submit it writes to localStorage
      $("#settings-form").submit(function(){
        Vussion.debugLog("bind form");
        Vussion.settings.server = $("#serverAddress").val();
        Vussion.settings.port = $("#serverPort").val();
        Vussion.settings.role = $("#deviceRole").val();

        Vussion.writeSettingsToLocalStorage();
        return false;
      })
      
    },
    playVideo: function(){
      Vussion.debugLog("change video file & play");
      console.log(Vussion.state.current.video);
      Vussion.vidplayer.src(Vussion.state.current.video).play();
    },
    getCurrentState: function(){
      Vussion.debugLog("getting current state");
      Vussion.socket.emit('request state');
    },
    changeSlide: function(num){
      Vussion.debugLog("change slide");
      $("#slider-container").superslides('animate', num);
    },
    writeSettingsToLocalStorage: function(){
      Vussion.debugLog("write to local storage");
      window.localStorage.setItem('settings', JSON.stringify(Vussion.settings));
      location.reload( true ); 
    },
    getSettingsFromLocalStorage: function(){
      Vussion.debugLog("read from local storage");
      merge(Vussion.settings, $.parseJSON( window.localStorage.getItem('settings') ) );
      $("#serverAddress").val(Vussion.settings.server);
      $("#serverPort").val(Vussion.settings.port);
      $("#deviceRole").val(Vussion.settings.role);
    },
    debugLog: function(message){
      console.log(message);
      $('#debugger ul').append($('<li>').text(message));
    },
    compileTemplate: function(templateID, data){
      var source   = $(templateID).html();
      var template = Handlebars.compile(source);
      var markup = template(data);
      return markup;
    },
    registerHandlebarHelpers: function(){

      Handlebars.registerHelper('assetPath', function(options) {
        var html = Vussion.settings.pathToAssets + options.fn(this);
        return html;
      });

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
        $("video").remove();
        // remove the entire Vussion.vidplayer from the dom
        $(Vussion.vidplayer.el).remove();  

      }
      
      $("section .content").remove();
      callback();
    },
    changeSection: function(modules, resID){
      //requires Vussion.state.current.modules to be updated
      console.log(modules , resID);
      $("section").removeClass("active");

      Vussion.settings.role = parseInt(Vussion.settings.role);
      perm = $.inArray(Vussion.settings.role, modules.content[resID].deviceID );
      console.log(modules.content[resID].deviceID, 'id sent', perm);
      console.log(Vussion.settings);

      if(perm  >-1){
      switch (modules.content[resID].type) {
        case "slides":
          // when an admin changes the section === "slider"
          var sectionEl = $("section#" + modules.content[resID].type);

          //check for slide array/ if it exists, we need a new template
          console.log('from slides', modules);
          if (modules.slidesArr.length > 1) {
           $("#slider-template img").remove(); //clean what was there
           //new array to step through
           $.each(modules.slidesArr, function(index, val) {
             $('.slides-container').append('<img src="'+ val +'" width="1024" height="768"/>'); 
           });
          }else{

            $(sectionEl).html(Vussion.compileTemplate("#slide-template", modules.content[resID]))
            .promise()
            .done(function(){

              Vussion.slider = $("#slider-template");

              $("section#" + modules.content[resID].type).addClass("active");
              
              $("#slider-container").superslides({
                play: 0
              }); 

            })
          }
          break;

        case "html":
          // when an admin changes the section === "html"
          var sectionEl = $("section#" + section.type);
          if(section.template){
            var html = Vussion.compileTemplate("#"+ section.template, section);
            $(sectionEl).html(html).promise().done(function(){
              $("section#" + section.type).addClass("active");
            })
          } else {
            var html = Vussion.compileTemplate("#html-template-basic", section);
            $(sectionEl).html(html).promise().done(function(){
              $("section#" + section.type).addClass("active");
            }) 
          }
          
          break;

        case "video":
          var sectionEl = $("section#" + modules.content[resID].type);
          modules.videoPlayerID = randomString();
          console.log("random player id " + modules.videoPlayerID);
          console.log(modules);
          var html = Vussion.compileTemplate("#video-template", modules);
          $(sectionEl).html(html).promise().done(function(){
            $("section#" + modules.content[resID].type).addClass("active");
            Vussion.vidplayer = videojs("#player-" + modules.videoPlayerID);
            Vussion.vidplayer.src(modules.content[resID].media).play(function(){
              console.log('is playing');
            })
            .on('end', function(event) {
              event.preventDefault();
              console.log('done');
              console.log('shows over');
            $("section").removeClass('active');
            $('section#loading').addClass('active');
            $('#loading img').attr('src', modules.background);
            });
            console.log(Vussion.vidplayer);
          })
          break;

        default:
          Vussion.debugLog("loading default slide");
          console.log(modules);
          // $("section#loading").addClass("active");
          $("section#loading p").empty();
          $("section#loading img").attr('src', modules.background );


          var sectionEl = $("section#slides");
          $(sectionEl).html(Vussion.compileTemplate("#slide-template", modules.content[resID])).promise().done(function(){
            Vussion.slider = $("#slider-template");

            $("section#slides").addClass("active");
            $('.slides-container img').attr('src', modules.background );
            $("#slider-container").superslides({
              play: 0
            }); 
            
          })
          break;
      }
          
      }else{
        console.log('you dont have permissions?');
      }
    }
  };  