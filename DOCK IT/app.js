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

// ==================== LOGIN Y ROLES ====================
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('btn-logout');

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
            
            document.getElementById('login-view').classList.remove('active');
            document.getElementById('dashboard-view').classList.add('active');
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });

    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        document.getElementById('dashboard-view').classList.remove('active');
        document.getElementById('login-view').classList.add('active');
        document.getElementById('login-form').reset();
        switchView('proyectos', document.querySelector('.sidebar-nav li'));
    });
});

function applyRoleUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    document.getElementById('ui-user-name').innerText = currentUser.name;
    document.getElementById('ui-user-role').innerText = currentUser.role;

    const navRegistrar = document.getElementById('nav-registrar');
    const actionButtons = document.querySelectorAll('.btn-action-lider');

    if (currentUser.role === 'Semillerista') {
        navRegistrar.style.display = 'none';
        actionButtons.forEach(btn => btn.style.display = 'none');
    } else {
        navRegistrar.style.display = 'flex';
        actionButtons.forEach(btn => btn.style.display = 'inline-block');
    }
}

// ==================== NAVEGACIÓN Y DRAWER ====================
function switchView(viewName, element) {
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');

    if(element) {
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
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    
    container.innerHTML = '';
    
    projects.forEach(proj => {
        let actionButtons = '';
        // Solo el LIDER ve los botones de eliminar y editar
        if (currentUser.role === 'Lider') {
            actionButtons = `
                <div class="project-actions">
                    <button class="btn-icon text-red" onclick="promptDeleteProject(${proj.id})"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-icon text-red"><i class="fa-solid fa-pen"></i></button>
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
    projects.push({ id: Date.now(), name: nameInput, progress: 0, tasksStr: '0 Tareas' });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    document.getElementById('new-project-name').value = '';
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
    document.getElementById('modal-overlay').classList.add('active');
    document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
    document.getElementById(modalId).classList.add('active');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
}