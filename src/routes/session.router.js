import { Router } from "express";
import UserModel from "../Dao/mongoManager/models/user.models.js";

const userRouter = Router()

userRouter.post("/login" , async (req, res) => {
    const { email, password } = req.body
    const user = await UserModel.findOne({ email, password })
    if(!user) return res.redirect("login")

    req.session.user = user
    
    if (user.role === "admin") {
        return res.redirect("/api/session/admin");
    } else {
        const welcomeMessage = `¡Bienvenido, ${user.first_name}! Has iniciado sesión exitosamente.`;
        const logoutParam = req.query.logout;
        const goodbyeMessage = logoutParam ? "Has cerrado sesión exitosamente." : null;

        return res.redirect(`/api/products?message=${encodeURIComponent(welcomeMessage)}&goodbyeMessage=${encodeURIComponent(goodbyeMessage)}`);
    }
})

userRouter.post("/register", async (req, res) => {
    const user = req.body;
    const existingUser = await UserModel.findOne({ email: user.email });
    if (existingUser) {
        return res.status(409).send("El correo electrónico ya está registrado.");
    }
    if (user.email === "adminCoder@coder.com") {
        user.role = "admin"; 
    } else {
        user.role = "user"; 
    }

    await UserModel.create(user);
    return res.redirect("/api/session/login");
});

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === "admin") {
        next();
    } else {
        res.status(403).json({ error: "Acceso denegado" });
    }
};
function auth (req, res, next) {
    if(req.session?.user) return next()
    res.redirect("/")
}

userRouter.get("/profile", auth, (req, res) => {
    const user = req.session.user
    res.render("/api/session/profile", user)
})

userRouter.get("/admin", isAdmin, (req, res) => {
    res.render("admin", {})
});

userRouter.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al destruir la sesión:", err);
        }
        return res.redirect("/api/session/login");
    });
});

export default userRouter