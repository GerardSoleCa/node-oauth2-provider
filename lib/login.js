module.exports = function (options) {
    return function (scope) {

        return function (req, res, next) {
            var token = getToken(req);

            if (!token) {
                res.statusCode = 401;
                return res.json({error: "invalid_request", error_description: "authenticated_resource"});
            }

            try {
                var data = options.serializer.parse(token);

                console.log(data);
                req.oauth = {
                    type: data.type,
                    user_id: data.user_id,
                    client_id: data.client_id,
                    issued_at: data.issued_at,
                    expires_at: data.expires_at,
                    scope: data.scope,
                    custom_fields: data.custom_fields
                };

                if (req.oauth.type != 'access_token') {
                    res.statusCode = 400;
                    return res.json({error: "invalid_grant", error_description: "invalid_accesstoken"});
                }

                if (req.oauth.expires_at > new Date()) {
                    res.statusCode = 400;
                    return res.json({error: "invalid_grant", error_description: "token_expired"});
                }

                //if(scope.indexOf(req.oauth.scope) === -1){
                //    console.log('waca');
                //    res.statusCode = 400;
                //    return res.json({error: "invalid_grant", error_description: "token_expired"});
                //}

                next();
            } catch (e) {
                res.statusCode = 400;
                return res.json({
                    error: "invalid_request",
                    error_description: "authenticated_resource",
                    error_message: "Unparse token error"
                });
            }
        }
    }
};

var getToken = function (req) {
    if (req.query.access_token) {
        return req.query.access_token;
    } else if ((req.headers.authorization || '').indexOf('Bearer') == 0) {
        return req.headers.authorization.replace('Bearer', '').trim();
    } else {
        return undefined;
    }
};