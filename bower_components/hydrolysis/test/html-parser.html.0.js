
    suite('parser returns expected ASTs', function() {
      var hyd = require('hydrolysis');
      var registry;

      setup(function(done) {
        var loader = new hyd.Loader();
        var resolver = new hyd.XHRResolver();
        loader.addResolver(resolver);
        loader.request("static/html-parse-target.html").then(function(content){
          registry = hyd._importParse(content);
          done();
        });
      });

      test('find all templates', function() {
        assert.isDefined(registry.template, "The returned registry should find templates");
        assert.equal(registry.template.length, 3);
      });

      test('find all scripts', function() {
        assert.isDefined(registry.script, "The returned registry should find scripts");
        assert.equal(registry.script.length, 2);
      });

      test('find all imports', function() {
        assert.isDefined(registry.import, "The returned registry should find imports");
        assert.equal(registry.import.length, 1);
      });

      test('find all styles', function() {
        assert.isDefined(registry.style, "The returned registry should find styles");
        assert.equal(registry.style.length, 3);
      });
    });
  