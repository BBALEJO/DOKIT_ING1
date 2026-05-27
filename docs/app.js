// ==================== BASE DE DATOS LOCALSTORAGE ====================
function initDB() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { email: 'lider@unilibre.edu.co', pass: '123', role: 'Lider', name: 'Admin Lider' },
            { email: 'semi@unilibre.edu.co', pass: '123', role: 'Semillerista', name: 'Juan Arévalo' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem('projects')) {
        const defaultProjects = [
            { id: 1, name: 'Federico', progress: 70, tasksStr: '7/10 Tareas' }
        ];
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }
}

// ==================== INITIALIZATION & EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('btn-logout');
    const profileForm = document.getElementById('profile-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            
            const users = JSON.parse(localStorage.getItem('users'));
            const user = users.find(u => u.email === email && u.pass === pass);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                document.getElementById('login-error').style.display = 'none';
                
                applyRoleUI(); 
                renderProjects(); 
                loadProfileData();
                
                document.getElementById('login-view').classList.remove('active');
                document.getElementById('dashboard-view').classList.add('active');
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            document.getElementById('dashboard-view').classList.remove('active');
            document.getElementById('login-view').classList.add('active');
            document.getElementById('login-form').reset();
            switchView('proyectos', document.querySelector('.sidebar-nav li'));
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileData();
        });
    }
    
    // Sesión activa al refrescar
    if (localStorage.getItem('currentUser')) {
        applyRoleUI();
        renderProjects();
        loadProfileData();
    }
});

function applyRoleUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    document.getElementById('ui-user-name').innerText = currentUser.name;
    document.getElementById('ui-user-role').innerText = currentUser.role;

    const navRegistrar = document.getElementById('nav-registrar');
    const actionButtons = document.querySelectorAll('.btn-action-lider');

    if (currentUser.role === 'Semillerista') {
        if (navRegistrar) navRegistrar.style.display = 'none';
        actionButtons.forEach(btn => btn.style.display = 'none');
    } else {
        if (navRegistrar) navRegistrar.style.display = 'flex';
        actionButtons.forEach(btn => btn.style.display = 'inline-block');
    }
}

// ==================== GESTIÓN DE PERFIL FUNCIONAL ====================
function loadProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    const pName = document.getElementById('profile-name');
    const pEmail = document.getElementById('profile-email');
    const pPass = document.getElementById('profile-pass');

    if (pName) pName.value = currentUser.name;
    if (pEmail) pEmail.value = currentUser.email;
    if (pPass) pPass.value = currentUser.pass;
}

function saveProfileData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let users = JSON.parse(localStorage.getItem('users')) || [];

    const newName = document.getElementById('profile-name').value;
    const newPass = document.getElementById('profile-pass').value;

    if (!newName || !newPass) return alert("Por favor complete todos los campos.");

    // Actualizar base de datos general
    users = users.map(u => {
        if (u.email === currentUser.email) {
            return { ...u, name: newName, pass: newPass };
        }
        return u;
    });
    localStorage.setItem('users', JSON.stringify(users));

    // Actualizar sesión actual local
    currentUser.name = newName;
    currentUser.pass = newPass;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Actualizar UI
    applyRoleUI();
    alert("¡Perfil actualizado con éxito!");
}

// ==================== NAVEGACIÓN Y DRAWER ====================
function switchView(viewName, element) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById('view-' + viewName);
    if (targetView) targetView.classList.add('active');

    if (element) {
        document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));
        element.classList.add('active');
    }
}

function toggleDrawer() {
    const drawer = document.getElementById('notification-drawer');
    const overlay = document.getElementById('drawer-overlay');
    
    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        drawer.classList.add('open');
        overlay.classList.add('active');
    }
}

// ==================== CRUD PROYECTOS ====================
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;
    
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    
    container.innerHTML = '';
    
    projects.forEach(proj => {
        let actionButtons = '';
        if (currentUser.role === 'Lider') {
            actionButtons = `
                <div class="project-actions">
                    <button class="btn-icon text-red" onclick="promptDeleteProject(${proj.id})"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-icon text-red" onclick="promptEditProject(${proj.id})"><i class="fa-solid fa-pen"></i></button>
                </div>
            `;
        }

        container.innerHTML += `
            <div class="project-card">
                <div class="project-img">
                    <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" alt="Robot">
                </div>
                <div class="project-info">
                    <h3>${proj.name}</h3>
                    <div class="progress-container">
                        <span class="progress-text">${proj.tasksStr || '0/0 Tareas'} ${proj.progress}%</span>
                        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${proj.progress}%;"></div></div>
                    </div>
                </div>
                ${actionButtons}
            </div>
        `;
    });
}

function createProject() {
    const nameInput = document.getElementById('new-project-name').value;
    if (!nameInput) return alert("Ingrese un nombre");

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects.push({ id: Date.now(), name: nameInput, progress: 0, tasksStr: '0/0 Tareas' });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    document.getElementById('new-project-name').value = '';
    closeModal();
    renderProjects();
}

// Corregido: Ahora se llama adecuadamente desde el botón dinámico del render
function promptEditProject(id) {
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const proj = projects.find(p => p.id === id);
    if (!proj) return;

    document.getElementById('edit-project-id').value = proj.id;
    document.getElementById('edit-project-name').value = proj.name;
    openModal('modal-editar');
}

function saveEditProject() {
    const id = parseInt(document.getElementById('edit-project-id').value);
    const updatedName = document.getElementById('edit-project-name').value;
    if (!updatedName) return alert("El nombre no puede estar vacío");

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects = projects.map(p => p.id === id ? { ...p, name: updatedName } : p);

    localStorage.setItem('projects', JSON.stringify(projects));
    closeModal();
    renderProjects();
}

function promptDeleteProject(id) {
    document.getElementById('delete-project-id').value = id;
    openModal('modal-eliminar');
}

function confirmDeleteProject() {
    const id = parseInt(document.getElementById('delete-project-id').value);
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('projects', JSON.stringify(projects));
    closeModal();
    renderProjects();
}

// ==================== MODALES ====================
function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    if (overlay && modal) {
        overlay.classList.add('active');
        document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
        modal.classList.add('active');
    }
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
    }
}
