var chai = require('chai'),
    should = chai.should,
    expect = chai.expect,
    Promise = require('bluebird'),
    request = require('superagent-promise')(require('superagent'), Promise),
    chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised);

var url = process.env.URL || 'http://localhost:8000/todos';

//region Convenience Functions

function post(url, data) {
    return request.post(url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(data)
        .end();
}

function get(url, data) {
    return request.get(url)
        .set('Accept', 'application/json')
        .send(data)
        .end();


}

function del(url) {
    return request.del(url).end();
}

function update(url, method, data) {
    return request(method, url)
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .send(data)
        .end();
}

function assert(result, prop) {
    /* result.then(function (response) {
        console.log(response.headers);
        console.log(response.data);
    }); */
    return expect(result).to.eventually.have.deep.property(prop)
}

//endregion

describe('Cross Origin Requests', function () {
    var result;

    before(function () {
        result = request('OPTIONS', url).set('Origin', 'http://someplace.com').end();
    });

    it('should return the correct CORS headers', function () {
        return assert(result, "header").to.contain.all.keys([
            'access-control-allow-origin',
            'access-control-allow-methods',
            'access-control-allow-headers'
        ]);
    });

    it('should allow all origins', function () {
        return assert(result, "header").to.have.property('access-control-allow-origin').to.equal('*');
    });

});

describe('Create Todo Item', function () {
    var result;

    before(function () {
        result = post(url, {title: 'Walk the dog'});
    });

    it('should return a 201 CREATED response', function () {
        return assert(result, 'status').to.equal(201);
    });


    it('should receive a location hyperlink', function () {
        return assert(result, 'header').to.have.property('location').to.match(/^https?:\/\/.+\/todos\/[\d]+$/);
    });

    it('should create the item', function () {
        var item = result.then(function (res) {
            return get(res.header['location'])
        });
        return assert(item, "body").to.have.property("title").that.equals('Walk the dog');
    });

    after(function () {
        del(url);
    })


});

describe('Update Todo Item', function () {
    var result;

    beforeEach(function () {
        result = post(url, {title: 'Walk the dog'});
    });

    it('should have completed set to true after PUT update', function () {
        result.then(function (res) {
            var location = res.header['location'];
            var updateResult = update(location, 'PUT', {'completed': true});
            return assert(updateResult, 'body').to.have.property('completed').to.be.true;
        });
    });


    it('should have completed set to true after PATCH update', function () {
        result.then(function (res) {
            var location = res.header['location'];
            var updateResult = update(location, 'PATCH', {'completed': true});
            return assert(updateResult, 'body').to.have.property('completed').to.be.true;
        });
    });

    after(function () {
        del(url);
    })


});


describe('Delete Todo Item', function () {
    var result;

    beforeEach(function () {
       result= post(url, {title: 'Walk the dog'});
    });

    it('should return a 204 NO CONTENT response', function () {
        result.then(function (res) {
            var location = res.header['location'];
            var delResult = del(location);
            return assert(delResult, 'status').to.be.equal(204);
        });
    });


    it('should delete the item', function () {

        result.then(function (res) {
            var location = res.header['location'];
            var delResult = del(location).then(function (res) {
                return get(location)
            });;
            return expect(result).to.eventually.be.rejectedWith('Not Found');
        });
    });


    after(function () {
        del(url);
    })


});
