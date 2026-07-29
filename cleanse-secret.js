var fs = require('fs');
['check_supabase.mjs', 'migrate_rest.mjs'].forEach(function(f) {
  try {
    var c = fs.readFileSync(f, 'utf8');
    c = c.replace(/'sbp_[a-f0-9_]+'/g, 'process.env.SUPABASE_ACCESS_TOKEN');
    fs.writeFileSync(f, c);
  } catch(e) {}
});
