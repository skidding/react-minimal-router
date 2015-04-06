var React = require('react'),
    _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    uri = require('../src/uri.js'),
    Router = require('../src/router.js');

chai.use(sinonChai);

describe('Router class', function() {
  var ComponentClass = {},
      componentInstance = {},
      routerOptions,
      routerInstance,
      location,
      uriParams;

  var stubWindowApi = function() {
    sinon.stub(Router.prototype, '_getCurrentLocation', function() {
      return location;
    });
    sinon.stub(Router.prototype, '_isPushStateSupported').returns(true);
    sinon.stub(Router.prototype, '_bindPopStateEvent');
    sinon.stub(Router.prototype, '_unbindPopStateEvent');
    sinon.stub(Router.prototype, '_pushHistoryState');
  };

  var restoreWindowApi = function() {
    Router.prototype._getCurrentLocation.restore();
    Router.prototype._isPushStateSupported.restore();
    Router.prototype._bindPopStateEvent.restore();
    Router.prototype._unbindPopStateEvent.restore();
    Router.prototype._pushHistoryState.restore();
  };

  var genericTests = function() {
    it('should unserialize location', function() {
      expect(uri.parseLocation.lastCall.args[0]).to.equal(location);
    });

    it('should call getComponentClass with name', function() {
      expect(routerOptions.getComponentClass.lastCall.args[0])
            .to.equal(uriParams.component);
    });

    it('should call createElement with returned class', function() {
      expect(React.createElement.lastCall.args[0]).to.equal(ComponentClass);
    });

    it('should render using URL params as props', function() {
      var propsSent = React.createElement.lastCall.args[1];
      expect(propsSent.dataUrl).to.equal(uriParams.props.dataUrl);
    });

    it('should attach router reference to props', function() {
      expect(React.createElement.lastCall.args[1].router)
            .to.equal(routerInstance);
    });

    it('should extend default props', function() {
      var props = React.createElement.lastCall.args[1];
      expect(props.dataUrl).to.equal(uriParams.props.dataUrl);
      expect(props.defaultProp).to.equal(true);
    });

    it('should use container node received in options', function() {
      expect(React.render.lastCall.args[1]).to.equal('<fake DOM element>');
    });

    it('should expose reference to root component', function() {
      expect(routerInstance.rootComponent).to.equal(componentInstance);
    });

    it('should call onChange callback with params', function() {
      var params = routerOptions.onChange.lastCall.args[0];
      expect(params.component).to.equal(uriParams.component);
      expect(params.props.dataUrl).to.equal(uriParams.props.dataUrl);
    });
  };

  var currentLocationTests = function() {
    it('should get current location', function() {
      expect(routerInstance._getCurrentLocation).to.have.been.called;
    });
  };

  var pushLocationTests = function() {
    it('should check if pushState is supported', function() {
      expect(routerInstance._isPushStateSupported).to.have.been.called;
    });

    it('should push new entry to browser history', function() {
      // It's a bit difficult to mock the native functions so we mocked the
      // private methods that wrap those calls
      //expect(routerInstance._pushHistoryState).to.have.been.called;
      expect(routerInstance._pushHistoryState.lastCall.args[1])
          .to.equal(location);
    });
  };

  beforeEach(function() {
    stubWindowApi();

    sinon.stub(uri, 'parseLocation', function() {
      return uriParams;
    });

    sinon.stub(React, 'createElement');
    sinon.stub(React, 'render', function() {
      return componentInstance;
    });

    // Fake browser location and mock (already tested) uri.js lib
    location = 'mypage.com?component=List&dataUrl=users.json';

    uriParams = {
      component: 'List',
      props: {
        dataUrl: 'users.json'
      }
    };

    routerOptions = {
      defaultProps: {
        defaultProp: true
      },
      container: '<fake DOM element>',
      getComponentClass: sinon.stub().returns(ComponentClass),
      onChange: sinon.spy()
    };

    routerInstance = new Router(routerOptions);
  });

  afterEach(function() {
    restoreWindowApi();

    uri.parseLocation.restore();

    React.createElement.restore();
    React.render.restore();
  });

  describe('initial location', function() {
    currentLocationTests();
    genericTests();
  });

  describe('changing location', function() {
    beforeEach(function() {
      location = 'mypage.com?component=User&dataUrl=user.json';

      uriParams = {
        component: 'User',
        props: {
          dataUrl: 'user.json'
        }
      };
    });

    describe('.goTo method', function() {
      beforeEach(function() {
        routerInstance.goTo(location);
      });

      pushLocationTests();
      genericTests();
    });

    describe('.routeLink method', function() {
      beforeEach(function() {
        routerInstance.routeLink({
          preventDefault: function() {},
          currentTarget: {
            href: location
          }
        });
      });

      pushLocationTests();
      genericTests();
    });

    describe('.PopState event', function() {
      beforeEach(function() {
        routerInstance.onPopState({
          state: {}
        });
      });

      currentLocationTests();
      genericTests();
    });
  });
});
