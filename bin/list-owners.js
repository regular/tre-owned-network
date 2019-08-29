/* Usage:
 * 
 *   list-owners [--config CONFIG] 
 *
 * CONFIG defaults to `require('rc')('tre')`
*/

const client = require('tre-cli-client')
const owners = require('../list-owners')
const watch = require('mutant/watch')

function bail(err) {
  if (!err) return
  console.error(err.message)
  process.exit(1)
}

client( (err, ssb, conf, keys) =>{
  bail(err)
  const result = owners(ssb, conf.network, conf, err => {
    bail(err)
    console.log(result().join('\n'))
    ssb.close()
  })
  if (conf.live) {
    watch(result, owners=>{
      console.log(JSON.stringify(owners, null, 2) + '\n')
    })
  }
})
