
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        
        res.redirect('/');
    } else {
       
        next()
    }
}

function isAdminAuthenticated(req, res, next) {
    if (req.session.userId) {
        
        res.redirect('/dashboard');
    } else {
       
        next()
    }
}

function logout(req, res ,next) {
    req.session.destroy(err => {
        if (err) {
            console.log(err); 
            return res.redirect('/'); 
        }
        res.redirect('/sign-in');
    });
}

const isAuthenticate = (req, res, next) => {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.redirect('/sign-in');
    }
};



module.exports = {
    isAuthenticate,
    isAuthenticated,
    isAdminAuthenticated,
    logout
};
