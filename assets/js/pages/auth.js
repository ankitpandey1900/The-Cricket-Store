/**
 * auth.js — Login & Registration Logic
 * Khelo Ji Store
 */

document.addEventListener('DOMContentLoaded', () => {
    let selectedRole = 'buyer';

    window.KheloJiDB.init();

    // Elements
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginEmail = document.getElementById('login-email');
    const loginPass = document.getElementById('login-password');
    const regName = document.getElementById('reg-name');
    const regEmail = document.getElementById('reg-email');
    const regPass = document.getElementById('reg-password');
    const roleBuyer = document.getElementById('role-buyer');
    const roleSeller = document.getElementById('role-seller');

    // Auth guard
    const user = window.KheloJiDB.users.current();
    if (user) {
        window.location.href = user.role === 'seller' ? 'seller.html' : '../index.html';
    }

    // Tabs
    window.switchTab = (tab) => {
        loginTab.classList.toggle('active', tab === 'login');
        registerTab.classList.toggle('active', tab === 'register');
        loginForm.classList.toggle('active', tab === 'login');
        registerForm.classList.toggle('active', tab === 'register');
    };

    // Role Selection
    window.selectRole = (role) => {
        selectedRole = role;
        roleBuyer.classList.toggle('selected', role === 'buyer');
        roleSeller.classList.toggle('selected', role === 'seller');
    };

    // Demo fill
    window.fillDemo = (email, password) => {
        loginEmail.value = email;
        loginPass.value = password;
    };

    function showError(id, msg) {
        const el = document.getElementById(id);
        el.textContent = msg;
        el.classList.add('show');
        setTimeout(() => el.classList.remove('show'), 4000);
    }

    // Handlers
    window.handleLogin = async () => {
        const email = loginEmail.value.trim();
        const password = loginPass.value;
        if (!email || !password) return showError('login-error', 'Please fill all fields.');
        
        const result = await window.KheloJiDB.users.login(email, password);
        if (result.error) return showError('login-error', result.error);
        
        window.location.href = result.user.role === 'seller' ? 'seller.html' : '../index.html';
    };

    window.handleRegister = async () => {
        const name = regName.value.trim();
        const email = regEmail.value.trim();
        const password = regPass.value;
        
        if (!name || !email || !password) return showError('register-error', 'Please fill all fields.');
        if (password.length < 6) return showError('register-error', 'Password must be at least 6 characters.');
        
        const result = await window.KheloJiDB.users.register(name, email, password, selectedRole);
        if (result.error) return showError('register-error', result.error);
        
        // Auto login is handled within register in the new API, 
        // but we'll follow previous pattern of checking role and redirecting.
        window.location.href = selectedRole === 'seller' ? 'seller.html' : '../index.html';
    };

    // Support enter key
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const isLogin = loginForm.classList.contains('active');
            isLogin ? window.handleLogin() : window.handleRegister();
        }
    });
});
