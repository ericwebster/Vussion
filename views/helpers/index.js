
module.exports = function() {

  var helpers = {};

  helpers.ifEqual  = function(v1, v2, options) {
    console.log(v1 +"==="+ v2);
    if(v1 === v2) {
      return options.fn(this);
    }
    return options.inverse(this);
  };

  return helpers;

}

