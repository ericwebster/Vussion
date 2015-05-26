

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
        section: 'loading',
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
        }
      });
      Vussion.registerHandlebarHelpers();
      Vussion.bindEvents();
      Vussion.resetAllClients();
    },
    bindEvents: function(){
      //switcher for section
      //this needs to not be a select box :()
      $(".sidebar .dropdown-menu a").on('click', function(e){
        e.preventDefault();
        Vussion.state.current.sectionID = $(this).attr('href');

        _.each(Vussion.data.sections, function(el){
          if(el.id === Vussion.state.current.sectionID){
            Vussion.state.current.section = el;
            Vussion.cleanupGarbage(function(){
              Vussion.changeSection(el);  
            });
            
            return false;
          }
        });

      });

      Vussion.socket.on("request state", function(){
        Vussion.sendCurrentState();
      })

    },
    resetAllClients: function(){
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
    changeSection: function(section){
      //requires Vussion.state.current.section to be updated
      $("section").removeClass("active");     
      

      switch (section.type) {
        case "slider":
          // when an admin changes the section === "slider"
          var sectionEl = $("section#" + section.type);

          var html = Vussion.compileTemplate("#slide-template", section);
          $(sectionEl).html(html).promise().done(function(){
            Vussion.state.current.slide = 0;
            Vussion.slider = $("#slick-slider").slick({
              onAfterChange: function(slider){
                Vussion.state.current.slide = slider.currentSlide;
                Vussion.sliderChange(slider.currentSlide);
              }
            });

            $("section#" + section.type).addClass("active");
          })  

          
          Vussion.updateClients();
          break;

        case "html":
          // when an admin changes the section === "html"
          var sectionEl = $("section#" + section.type);
          if(!section.template){
            section.template = "html-template-basic";
          }

          var html = Vussion.compileTemplate("#"+ section.template, section);
          console.log(section)
          console.log(html);
            $(sectionEl).html(html).promise().done(function(){
              $("section#" + section.type).addClass("active");
            })

          Vussion.updateClients();
          break;

        case "video":
          var sectionEl = $("section#" + section.type);
          section.videoPlayerID = randomString();
          var html = Vussion.compileTemplate("#video-template", section);
          $(sectionEl).html(html).promise().done(function(){
            $("section#" + section.type).addClass("active");
            Vussion.vidplayer = videojs("#player-" + section.videoPlayerID);
            $("#video-selector a").click(function(){
                Vussion.state.current.video = $(this).attr("href");
                console.log(Vussion.state.current.video);
                Vussion.videoChange(Vussion.state.current.video);
                Vussion.vidplayer.src(Vussion.settings.pathToAssets + Vussion.state.current.video).play();
                return false;
            })
            Vussion.updateClients();
          })
          break;

        case "loading":
          $("section#" + section.type).addClass("active");
          Vussion.updateClients();
          break;
        default:
          console.log("hmmm I dont know what to do with this one.");
          break;
      }

      
      //Vussion.adminControl.slickGoTo(0);
      
    },
    loadContent: function(){

    }
  };  