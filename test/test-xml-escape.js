var tap = require('tap');

var escape = require('../lib/xml_escape');

tap.test('XML is escaped', function(test) {
  test.equal(escape('Shoots & Ladders'), 'Shoots &amp; Ladders');
  test.equal(escape('Eats & Shoots & Leaves'), 'Eats &amp; Shoots &amp; Leaves');
  test.equal(escape('Yo\' Ho "& <a bottle> of rum"'),
    'Yo&apos; Ho &quot;&amp; &lt;a bottle&gt; of rum&quot;');
  test.end();
});