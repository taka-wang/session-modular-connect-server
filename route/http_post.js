var passwd      = require("../conf/passwd.json"),
    httpUtils   = require("./http_utils.js"),
    path        = require("path"),
    rename      = require("fs").rename,
    stat        = require("fs").stat;

module.exports.route = {
    "/login"  : login,
    "/upload" : upload
    //more url/handler pairs
};

function login(req, res, next) {
    if (passwd[req.body.username] === req.body.password) {
        req.session_state.username = req.body.username;
        httpUtils.redirect(req, res, "/");    //must for ajax call
    } else {
        res.writeHead(403);                   //Forbidden
        res.end("");
    }
}

function upload(req, res, next) {
    var jsonData  = [],
        imagesObj = req.files.images,
        uploadDir = path.dirname(__dirname) + "/uploads/";

    // process multi files upload
    if (Array.isArray(imagesObj)) {
        var totalLength = imagesObj.length;

        imagesObj.forEach(function (_image) {
            var oldPath = _image.path,
                newPath = uploadDir + _image.name,
                propObj = {
                    name : _image.name,
                    size : _image.size
                };

            rename(oldPath, newPath, function (_err) {
                if (_err) {
                    httpUtils.notFoundResp(res);        // 404 not found
                    throw _err;
                }

                stat(newPath, function (_err, _stats) {
                    if (_err) {
                        httpUtils.internelError(res);   // 500 internel server error
                        throw _err;
                    }

                    jsonData.push(propObj);
                    totalLength--;

                    if (!totalLength) {
						res.setHeader("Content-Type", "application/json");
                        httpUtils.jsonResp(res, jsonData);
                    }
                });
            });
        });
    } else {
        var oldPath = imagesObj.path,
            newPath = uploadDir + imagesObj.name,
            propObj = {
                name : imagesObj.name,
                size : imagesObj.size
            };

        rename(oldPath, newPath, function (_err) {
            if (_err) {
                httpUtils.notFoundResp(res);            // 404 not found
                throw _err;
            }

            stat(newPath, function (_err, _stats) {
                if (_err) {
                    httpUtils.internelErrorResp(res);   // 500 internel server error
                    throw _err;
                }
                jsonData.push(propObj);
				res.setHeader("Content-Type", "application/json");
                httpUtils.jsonResp(res, jsonData);
            });
        });
    }
}