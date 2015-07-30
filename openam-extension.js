(function(ext) {
  var authObject = null,
      ssoTokenId = null,
      userDetails = null,
      inputNeeded = false,
      complete = false,
      authenticateResponse = function(response) {
        if (response.tokenId) {
          ssoTokenId = response.tokenId;
          complete = true;
        } else {
          authObject = response;
          inputNeeded = true;
        }
      };

  // Cleanup function when the extension is unloaded
  ext._shutdown = function() {};

  // Status reporting code
  // Use this to report missing hardware, plugin or unsupported browser
  ext._getStatus = function() {
    return {status: 2, msg: 'Ready'};
  };

  ext.startAuth = function(amUrl) {
    baseAmUrl = amUrl;
    authObject = {};
    ext.authenticate();
  };
  ext.authenticate = function(amUrl) {
    // Make an AJAX call to the OpenAM authenticate endpoint
    $.ajax({
      url: amUrl + '/json/authenticate',
      dataType: 'jsonp',
      type: 'POST',
      data: authObject,
      mimeType: 'application/json',
      success: authenticateResponse
    });
  };

  ext.inputNeeded = function() {
    if (inputNeeded === true) {
      inputNeeded = false;
      return true;
    }
    return false;
  };

  ext.getNumberInputs = function() {
    return authObject.callbacks.length;
  };

  ext.getInput = function(i) {
    return 'Please enter your ' + authObject.callbacks[i].output;
  };

  ext.setInput = function(i, value) {
    authObject.callbacks[i].input.value = value;
  };

  ext.getDetails = function(attribute, callback) {
    if (userDetails) {
      callback(userDetails[attribute]);
      return;
    }
    $.ajax({
      url: amUrl + '/json/users?_action=idFromSession',
      headers: { iPlanetDirectoryPro: ssoTokenId },
      data: '{}',
      dataType: 'jsonp',
      type: 'POST',
      mimeType: 'application/json'
    }).then(null, function(result) {
      return $.ajax({
        url: amUrl + '/json/users/' + result.id,
        headers: { iPlanetDirectoryPro: ssoTokenId },
        dataType: 'jsonp',
        type: 'GET'
      })
    }).done(function(result) {
      userDetails = result;
      callback(userDetails[attribute]);
    };
  };

  ext.complete = function() {
    if (complete === true) {
      complete = false;
      return true;
    }
    return false;
  };

  // Block and block menu descriptions
  var descriptor = {
    blocks: [
      ['', 'start authentication from %s', 'startAuth', 'http://local.example.com:8080/openam'],
      ['h', 'authentication input needed', 'inputNeeded'],
      ['r', 'get authentication input count', 'getNumberInputs'],
      ['r', 'get authentication input %n', 'getInput'],
      ['', 'set authentication input %n to %s', 'setInput'],
      ['', 'send authentication details', 'authenticate'],
      ['h', 'authentication complete', 'complete'],
      ['R', 'get user detail called %s', 'getDetails', 'cn'],
    ]
  };

  // Register the extension
  ScratchExtensions.register('OpenAM Extension', descriptor, ext);
})({});
