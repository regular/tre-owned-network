const pull = require('pull-stream')
const ssbKeys = require('scuttlebot-release/node_modules/ssb-keys')
const {isFeedId} = require('ssb-ref')
const MutantArray = require('mutant/array')
const computed = require('mutant/computed')
const collectMutations = require('collect-mutations')

module.exports = function(ssb, network, opts, cb) {
  if (typeof opts == 'function') {
    cb = opts
    opts = {}
  }
  opts = opts || {}

  const {live} = opts
  const sync = live

  const raw = MutantArray()
  const verified = computed(raw, raw =>{
    let result
    pull(
      pull.values(raw),
      process(),
      pull.collect((err, res)=>{
        result = res
      })
    )
    return result
  })

  pull(
    ssb.revisions.messagesByType('network-owner', {live, sync}),
    collectMutations(raw, {live, sync}, cb)
  )

  return verified

  function process() {
    return pull(
      pull.map(kv=>{
        const {content} = kv.value
        const {declaration} = content
        const verified = ssbKeys.verifyObj(network.substr(1), declaration)
        return {
          verified,
          declaration
        }
      }),
      pull.filter(({verified, declaration})=>{
        if (!verified) return false
        if (declaration.network !== network) return false
        if (!isFeedId(declaration['owned-by'])) return false
        return true
      }),
      pull.map(({declaration})=>declaration['owned-by']),
      pull.unique()
    )
  }
}
