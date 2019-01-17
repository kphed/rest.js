const nock = require('nock')
const getUserAgent = require('universal-user-agent')

const Octokit = require('../../')

require('../mocha-node-setup')

describe('smoke', () => {
  it('called as function', () => {
    Octokit()
  })

  it('baseUrl options', () => {
    nock('http://myhost.com')
      .get('/my/api/orgs/myorg')
      .reply(200, {})

    const octokit = new Octokit({
      baseUrl: 'http://myhost.com/my/api'
    })

    return octokit.orgs.get({ org: 'myorg' })
  })

  it('response.status & response.headers', () => {
    nock('http://myhost.com')
      .get('/my/api/orgs/myorg')
      .reply(200, {}, { 'x-foo': 'bar' })

    const octokit = new Octokit({
      baseUrl: 'http://myhost.com/my/api'
    })

    return octokit.orgs.get({ org: 'myorg' })

      .then(response => {
        expect(response.headers['x-foo']).to.equal('bar')
        expect(response.status).to.equal(200)
      })
  })

  it('custom user agent header as client option', () => {
    nock('https://smoke-test.com', {
      reqheaders: {
        'user-agent': `blah octokit.js/0.0.0-semantically-released ${getUserAgent()}`
      }
    })
      .get('/orgs/octokit')
      .reply(200, {})

    const octokit = new Octokit({
      baseUrl: 'https://smoke-test.com',
      headers: {
        'User-Agent': 'blah'
      }
    })

    return octokit.orgs.get({
      org: 'octokit'
    })
  })

  it('custom user agent header as request option', () => {
    nock('https://smoke-test.com', {
      reqheaders: {
        'user-agent': `blah`
      }
    })
      .get('/orgs/octokit')
      .reply(200, {})

    const octokit = new Octokit({
      baseUrl: 'https://smoke-test.com'
    })

    return octokit.orgs.get({
      org: 'octokit',
      headers: {
        'User-Agent': 'blah'
      }
    })
  })

  it('custom accept header', () => {
    nock('https://smoke-test.com', {
      reqheaders: {
        'accept': 'foo'
      }
    })
      .get('/orgs/octokit')
      .reply(200, {})
      .persist()

    const octokit = new Octokit({
      baseUrl: 'https://smoke-test.com'
    })

    return Promise.all([
      octokit.orgs.get({
        org: 'octokit',
        headers: {
          accept: 'foo'
        }
      }),
      octokit.orgs.get({
        org: 'octokit',
        headers: {
          Accept: 'foo'
        }
      })
    ])
  })

  it('.request("GET /")', () => {
    nock('https://smoke-test.com', {
      reqheaders: {
        'accept': 'application/vnd.github.v3+json'
      }
    })
      .get('/')
      .reply(200, {})

    const octokit = new Octokit({
      baseUrl: 'https://smoke-test.com'
    })
    return octokit.request('GET /')
  })

  it('.request.endpoint("GET /")', () => {
    const octokit = new Octokit({
      baseUrl: 'https://smoke-test.com'
    })

    const requestOptions = octokit.request.endpoint('GET /')
    expect(requestOptions).to.deep.equal({
      method: 'GET',
      url: 'https://smoke-test.com/',
      headers: {
        accept: 'application/vnd.github.v3+json',
        'user-agent': `octokit.js/0.0.0-semantically-released ${getUserAgent()}`
      },
      request: {}
    })
  })

  it('global defaults', () => {
    const github1 = new Octokit()
    const github2 = new Octokit()

    expect(github1.request.endpoint.DEFAULTS).to.deep.equal(github2.request.endpoint.DEFAULTS)
  })

  it('registerEndpoints', () => {
    nock('https://smoke-test.com')
      .get('/baz')
      .reply(200, {})

    const octokit = new Octokit({
      baseUrl: 'https://smoke-test.com'
    })
    expect(octokit.registerEndpoints).to.be.a('function')

    octokit.registerEndpoints({
      issues: {
        fooBar: {
          method: 'GET',
          url: '/baz'
        }
      }
    })

    // make sure .registerEndpoints does not remove other methods on the same scope
    expect(octokit.issues.get).to.be.a('function')

    return octokit.issues.fooBar()
  })

  it('options.log', () => {
    // console.debug not implemented in Node 6
    // cy.stub(console, 'debug')
    cy.stub(console, 'info')
    cy.stub(console, 'warn')
    cy.stub(console, 'error')
    const octokit1 = new Octokit()

    octokit1.log.debug('foo')
    octokit1.log.info('bar')
    octokit1.log.warn('baz')
    octokit1.log.error('daz')

    // expect(console.debug.callCount).to.equal(0)
    expect(console.info.callCount).to.equal(0)
    expect(console.warn.callCount).to.equal(1)
    expect(console.error.callCount).to.equal(1)

    const calls2 = []
    const octokit2 = new Octokit({
      log: {
        debug: calls2.push.bind(calls2),
        info: calls2.push.bind(calls2),
        warn: calls2.push.bind(calls2),
        error: calls2.push.bind(calls2)
      }
    })

    octokit2.log.debug('foo')
    octokit2.log.info('bar')
    octokit2.log.warn('baz')
    octokit2.log.error('daz')

    expect(calls2).to.deep.equal([
      'foo',
      'bar',
      'baz',
      'daz'
    ])
  })
})
