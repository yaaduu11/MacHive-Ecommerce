const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_KEY


const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/sign-in');
    }
};

const verifyAdmin = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.admin = decoded;
        next();
    } catch (err) {
        console.error('Token Verification Error:', err);
        res.status(400).json({ success: false, message: 'Invalid token.' });
    }
};

const checkAdminLoggedIn = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) {
        try {
            const decoded = jwt.verify(token, jwtSecret);
            if (decoded && decoded.is_admin) {
                return res.redirect('/admin/dashboard');
            }
        } catch (err) {
            return next();
        }
    }

    next();
};

const redirectIfNotAuthenticated = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.redirect('/admin');
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.admin = decoded;
        next();
    } catch (err) {
        res.redirect('/admin');
    }
};

const loginedUser = (req,res,next) => {
    if(req.session.userId) {
        res.redirect('/')
    }else{
        next();
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


module.exports = {
    isAuthenticated,
    loginedUser,
    isAdminAuthenticated,
    checkAdminLoggedIn,
    redirectIfNotAuthenticated,
    verifyAdmin,
    logout
};
