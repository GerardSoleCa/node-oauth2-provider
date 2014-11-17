var frisby = require('frisby');

var client_id = 'clientId', client_secret = 'clientSecret';

frisby.create('Get access_token from code')
    .addHeader('Authorization', 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64'))
    .post('http://localhost:8081/oauth/token', {
        grant_type: 'authorization_code',
        code: 'abc'
    })
    .expectStatus(200)
    .inspectBody()
    .expectHeaderContains('content-type', 'application/json')
    .afterJSON(function (response) {
        frisby.create('Get protected resource using access_token')
            .addHeader('Authorization', 'Bearer ' + response.access_token)
            .get('http://localhost:8081/secret')
            .expectStatus(200)
            .inspectBody()
            .expectJSON({
                response: "SECRET"
            }).toss();

        frisby.create('Renew access_token using refresh_token')
            .addHeader('Authorization', 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64'))
            .post('http://localhost:8081/oauth/token', {
                grant_type: 'refresh_token',
                refresh_token: response.refresh_token
            })
            .expectStatus(200)
            .inspectBody()
            .afterJSON(function (response) {
                frisby.create('Get protected resource using access_token from refresh_token')
                    .addHeader('Authorization', 'Bearer ' + response.access_token)
                    .get('http://localhost:8081/secret')
                    .expectStatus(200)
                    .inspectBody()
                    .expectJSON({
                        response: "SECRET"
                    }).toss();
            })
            .toss();
    })
    .toss();

frisby.create('Get access_token by password grant')
    .addHeader('Authorization', 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64'))
    .post('http://localhost:8081/oauth/token', {
        grant_type: 'password',
        username: 'test',
        password: 'test'
    })
    .expectStatus(200)
    .inspectBody()
    .expectHeaderContains('content-type', 'application/json')
    .afterJSON(function (response) {
        frisby.create('Get protected resource using access_token')
            .addHeader('Authorization', 'Bearer ' + response.access_token)
            .get('http://localhost:8081/secret')
            .expectStatus(200)
            .inspectBody()
            .expectJSON({
                response: "SECRET"
            }).toss();
    }).toss();