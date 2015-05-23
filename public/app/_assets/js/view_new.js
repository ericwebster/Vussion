

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
      port:'8080'
    },
    state:{
      current:{
        section: 'loading',
        slide: 0
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
      Vussion.socket = io("http://"+ this.settings.server + ":" + this.settings.port);
      this.debugLog(this.socket);
      this.registerHandlebarHelpers();
      this.bindEvents();
    },
    bindEvents: function(){
      this.debugLog("bind events")
      this.socket.on('connect', function(){
        this.serverConnected();
        this.debugLog("socket.on >> we're connected captain, engage");

        //have the client machine request the current state of the presentation
        this.debugLog("socket.on >> requested state");
        this.socket.emit("request state");


        //this should trigger a current state emit from the server
        this.socket.on('current state', function(res){
          this.debugLog("socket.on >> loading current state");
          this.debugLog(res);
          this.state.current = res;
          this.changeSection(res.section); 
        })


        //this is the main section change update, possibly rename todo:
        this.socket.on('update', function(res){
          this.debugLog("socket.on >> update")

          if(res.section.id != this.state.current.section.id){
            //section has changed
            this.debugLog("socket.on >> section change");
            this.debugLog(res);

            this.state.current = res;
            this.cleanupGarbage(function(){
              this.changeSection(res.section);
            });
          }

        });


        this.socket.on('change slide', function(slide){
          this.debugLog("socket.on >> slide change");
          this.debugLog("new slide >> " + slide);
          //todo: check if current slide is the one being animated to
          this.changeSlide(slide);
          
        }); 


        this.socket.on('change video', function(state){

            this.debugLog("video change");
            this.state.current.video = state.video;
            this.playVideo();
        }); 
      })
      this.socket.on('connect_error', function(err){
        this.debugLog("socket.on >> Oh-oh error on io.connect");
        this.debugLog("Settings >>");
        this.debugLog(this.settings);
        this.debugLog("Err OBJ >>");
        this.debugLog(err);
      })
      this.socket.on('error', function(err){
        this.debugLog("socket.on >> Oh-oh error on io.connect");
        this.debugLog("Settings >>");
        this.debugLog(this.settings);
        this.debugLog("Err OBJ >>");
        this.debugLog(err);
      })

      //this is the bind for the settings form, on submit it writes to localStorage
      $("#settings-form").submit(function(){
        this.debugLog("bind form");
        this.settings.server = $("#serverAddress").val();
        this.settings.port = $("#serverPort").val();
        this.writeSettingsToLocalStorage();
        return false;
      })
      
    },
    serverConnected: function(){
      this.debugLog("connected to server");
      $("#loading p").html("Connected, awaiting state");
    },
    playVideo: function(){
      this.debugLog("change video file & play");
      console.log(this.state.current.video);
      this.vidplayer.src(Vussion.state.current.video).play();
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
      window.reload();
    },
    getSettingsFromLocalStorage: function(){
      Vussion.debugLog("read from local storage");
      merge(Vussion.settings, $.parseJSON( window.localStorage.getItem('settings') ) );
    },
    debugLog: function(message){
      console.log(message);
      $('#debugger ul').append($('<li>').text(message.toString()));
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
    changeSection: function(section){
      //requires Vussion.state.current.section to be updated
      $("section").removeClass("active");

      switch (section.type) {
        case "slider":
          // when an admin changes the section === "slider"
          var sectionEl = $("section#" + section.type);
          $(sectionEl).html(Vussion.compileTemplate("#slide-template", section)).promise().done(function(){
            Vussion.slider = $("#slider-template");

            $("section#" + section.type).addClass("active");
            
            $("#slider-container").superslides({
              play: 0
            }); 

            if(Vussion.state.current.slide){
              Vussion.changeSlide(Vussion.state.current.slide);
            }
            
          })
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
          var sectionEl = $("section#" + section.type);
          section.videoPlayerID = randomString();
          console.log("random player id " + section.videoPlayerID);
          var html = Vussion.compileTemplate("#video-template", section);
          $(sectionEl).html(html).promise().done(function(){
            $("section#" + section.type).addClass("active");
            Vussion.vidplayer = videojs("#player-" + section.videoPlayerID, {
              "controls": false,
              "poster": "http://www.placehold.it/2048x1536.jpg"
            });
            console.log(Vussion.vidplayer);
          })
          break;

        default:
          Vussion.debugLog("loading default animation");
          $("section#loading").addClass("active");
          break;
      }
    }
  };  