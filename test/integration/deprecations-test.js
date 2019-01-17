const Octokit = require('../../')

const Mocktokit = Octokit
  .plugin((octokit) => {
    octokit.hook.wrap('request', () => null)
  })

describe('deprecations', () => {
  it('octokit.search.issues() has been renamed to octokit.search.issuesAndPullRequests() (2018-12-27)', () => {
    let warnCalled = false
    const octokit = new Mocktokit({
      log: {
        warn: () => {
          warnCalled = true
        }
      }
    })

    return octokit.search.issues({ q: 'foo' })
      .then(() => {
        expect(warnCalled).to.equal(true)
      })
  })
})
