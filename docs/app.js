let currentSelectedProjectId = null;

// ==================== BASE DE DATOS ESTRUCTURAL INICIAL ====================
function initDB() {
    // REPARADO: Volvieron los usuarios de prueba con sus roles correspondientes
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { email: 'lider@unilibre.edu.co', pass: '123', role: 'Lider', name: 'Prof. Lider Principal', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80' },
            { email: 'profe@unilibre.edu.co', pass: '123', role: 'Profesor', name: 'Ing. Carlos Docente', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80' },
            { email: 'semi@unilibre.edu.co', pass: '123', role: 'Semillerista', name: 'Breiner Bonilla', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
    
    if (!localStorage.getItem('projects')) {
        const defaultProjects = [
            { 
                id: 101, 
                name: 'Desarrollo de Robot Humanoide Inalámbrico', 
                status: 'Creado', 
                startDate: '2026-06-01', 
                endDate: '2026-11-30', 
                members: ['semi@unilibre.edu.co', 'lider@unilibre.edu.co'],
                photos: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80'],
                comments: [{ user: 'Prof. Lider Principal', text: 'Estructura inicial enrutada en base de datos.' }]
            }
        ];
        localStorage.setItem('projects', JSON.stringify(defaultProjects));
    }

    if (!localStorage.getItem('tasks')) {
        const defaultTasks = [
            { id: 1, projectId: 101, name: 'Calcular torque de servomotores', sprint: 'Sprint 1', status: 'sin-empezar', priority: 'Alta', assignee: 'Breiner Bonilla' }
        ];
        localStorage.setItem('tasks', JSON.stringify(defaultTasks));
    }

    if (!localStorage.getItem('timelineLogs')) {
        const defaultLogs = [
            {
                id: 1,
                projectName: 'Desarrollo de Robot Humanoide Inalámbrico',
                actionType: 'Inicialización de Proyecto',
                description: 'Se cargó el proyecto de manera formal dentro del semillero universitario.',
                imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80',
                timestamp: '01/06/2026, 08:00 AM'
            }
        ];
        localStorage.setItem('timelineLogs', JSON.stringify(defaultLogs));
    }
}

// ==================== DISPARADORES CORE ====================
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    const loginForm = document.getElementById('login-form');
    const btnLogout = document.getElementById('btn-logout');
    const profileForm = document.getElementById('profile-form');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-pass').value;
            
            // CORREGIDO: Ahora busca dinámicamente en el localStorage actualizado (acepta nuevos usuarios)
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);

            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                document.getElementById('login-error').style.display = 'none';
                dashboardStartup();
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
            document.getElementById('project-details-panel').style.display = 'none';
            switchView('proyectos', document.querySelector('.sidebar-nav li'));
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfileAdvanced();
        });
    }
    
    if (localStorage.getItem('currentUser')) {
        dashboardStartup();
    }
});

function dashboardStartup() {
    applyRoleUI(); 
    renderProjects(); 
    renderTasks();
    renderSprintsTable();
    renderUsersTable();
    renderTimeline();
    loadProfileAdvanced();
    populateProjectSelects();
}

function applyRoleUI() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    document.getElementById('ui-user-name').innerText = currentUser.name;
    document.getElementById('ui-user-role').innerText = currentUser.role;
    
    const userAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80';
    document.getElementById('ui-user-avatar').src = userAvatar;

    const actionLiderElements = document.querySelectorAll('.btn-action-lider');
    if (currentUser.role === 'Lider') {
        actionLiderElements.forEach(el => el.style.display = 'block');
        const btnProj = document.querySelector('.content-header .btn-action-lider');
        if(btnProj) btnProj.style.display = 'inline-block';
    } else {
        actionLiderElements.forEach(el => el.style.display = 'none');
    }
}

// ==================== AGREGAR LOG AUTOMÁTICO A LA LÍNEA DE TIEMPO ====================
function pushTimelineLog(projName, action, desc, img) {
    const logs = JSON.parse(localStorage.getItem('timelineLogs')) || [];
    const now = new Date();
    
    const newLog = {
        id: Date.now(),
        projectName: projName,
        actionType: action,
        description: desc,
        imageUrl: img || '',
        timestamp: now.toLocaleString('es-CO')
    };
    
    logs.unshift(newLog);
    localStorage.setItem('timelineLogs', JSON.stringify(logs));
    renderTimeline();
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    const logs = JSON.parse(localStorage.getItem('timelineLogs')) || [];
    container.innerHTML = '';

    if(logs.length === 0) {
        container.innerHTML = '<p class="text-center text-gray">No hay hitos registrados en la base de datos estructural.</p>';
        return;
    }

    logs.forEach(log => {
        let imgHtml = log.imageUrl ? `<img src="${log.imageUrl}" class="timeline-img" alt="Hito">` : '';
        container.innerHTML += `
            <div class="timeline-block">
                <div class="timeline-dot"></div>
                <div class="timeline-content-box">
                    <span class="text-small" style="float:right; font-weight:bold; color:#777;">${log.timestamp}</span>
                    <h4>${log.projectName}</h4>
                    <p style="margin-top:5px; font-size:0.9rem;"><b>Acción:</b> ${log.actionType}</p>
                    <p class="text-gray" style="font-size:0.85rem; margin-top:3px;">${log.description}</p>
                    ${imgHtml}
                </div>
            </div>
        `;
    });
}

// ==================== GESTIÓN DE PERFILES DIARIOS COMPLEJOS ====================
function loadProfileAdvanced() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-pass').value = currentUser.pass || '';
    
    const userAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
    document.getElementById('profile-avatar-url').value = currentUser.avatar || '';
    document.getElementById('profile-current-img').src = userAvatar;
}

function saveProfileAdvanced() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    let users = JSON.parse(localStorage.getItem('users')) || [];

    const newName = document.getElementById('profile-name').value;
    const newPass = document.getElementById('profile-pass').value;
    const newAvatar = document.getElementById('profile-avatar-url').value;

    if (!newName || !newPass) return alert("Complete los campos obligatorios.");

    users = users.map(u => {
        if (u.email === currentUser.email) {
            return { ...u, name: newName, pass: newPass, avatar: newAvatar };
        }
        return u;
    });
    localStorage.setItem('users', JSON.stringify(users));

    currentUser.name = newName;
    currentUser.pass = newPass;
    currentUser.avatar = newAvatar;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    dashboardStartup();
    alert("¡Su perfil diario ha sido complejizado y actualizado correctamente!");
}

// ==================== LÍDER: CREACIÓN MANUAL DE USUARIOS ====================
function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    tbody.innerHTML = '';

    users.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&q=80'}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                        <b>${u.name}</b>
                    </div>
                </td>
                <td>${u.email}</td>
                <td><span class="badge ${u.role === 'Lider'?'red':'gray'}">${u.role}</span></td>
            </tr>
        `;
    });
}

function createNewUserByLider() {
    const name = document.getElementById('user-new-name').value.trim();
    const email = document.getElementById('user-new-email').value.trim();
    const pass = document.getElementById('user-new-pass').value;
    const role = document.getElementById('user-new-role').value;

    if (!name || !email || !pass) return alert("Por favor complete todos los datos del participante.");

    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return alert("Error: El correo electrónico ya se encuentra registrado.");
    }

    // Inserción limpia en base de datos local
    users.push({
        name: name,
        email: email,
        pass: pass,
        role: role,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });

    localStorage.setItem('users', JSON.stringify(users));
    
    // Resetear formulario interno
    document.getElementById('user-new-name').value = '';
    document.getElementById('user-new-email').value = '';
    document.getElementById('user-new-pass').value = '';

    closeModal();
    
    // CORREGIDO: Forzar recarga completa de todos los componentes visuales del sistema
    dashboardStartup();
    
    alert(`Usuario "${name}" registrado con éxito. Ya puede iniciar sesión con este correo.`);
}

// ==================== INTERRUPTOR DE VISTAS ====================
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
    drawer.classList.toggle('open');
    overlay.classList.toggle('active');
}

// ==================== PROYECTOS Y PANEL DE EXPANSIÓN INTERACTIVO ====================
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
                <div class="project-actions" onclick="event.stopPropagation();">
                    <button class="btn-icon text-red" onclick="promptDeleteProject(${proj.id})"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-icon text-red" onclick="promptEditProject(${proj.id})"><i class="fa-solid fa-pen"></i></button>
                </div>
            `;
        }

        const projectImg = (proj.photos && proj.photos.length > 0) ? proj.photos[proj.photos.length - 1] : 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=150&q=80';

        container.innerHTML += `
            <div class="project-card" onclick="expandProjectDetails(${proj.id})">
                <div class="project-img">
                    <img src="${projectImg}" alt="Avance">
                </div>
                <div class="project-info">
                    <h3>${proj.name}</h3>
                    <p style="font-size:0.8rem; margin-bottom:4px;">Estado: <b>${proj.status}</b></p>
                    <span class="text-small">${proj.startDate} / ${proj.endDate}</span>
                </div>
                ${actionButtons}
            </div>
        `;
    });
}

function createProject() {
    const nameInput = document.getElementById('new-project-name').value;
    const startInput = document.getElementById('new-project-start').value;
    const endInput = document.getElementById('new-project-end').value;

    if (!nameInput || !startInput || !endInput) return alert("Complete los datos estructurales.");

    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const newId = Date.now();

    projects.push({ 
        id: newId, 
        name: nameInput, 
        status: 'Creado',
        startDate: startInput, 
        endDate: endInput,
        members: ['lider@unilibre.edu.co'],
        photos: [],
        comments: []
    });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    pushTimelineLog(nameInput, 'Inicialización de Proyecto', `El Líder del semillero creó el proyecto fijando fechas de control: ${startInput} hasta ${endInput}.`, '');

    document.getElementById('new-project-name').value = '';
    closeModal();
    dashboardStartup();
}

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
    if (!updatedName) return;

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    const oldProj = projects.find(p => p.id === id);

    projects = projects.map(p => p.id === id ? { ...p, name: updatedName } : p);
    localStorage.setItem('projects', JSON.stringify(projects));
    
    pushTimelineLog(updatedName, 'Modificación de Cabecera', `Se cambió el nombre estructural. Nombre previo: "${oldProj.name}".`, '');

    closeModal();
    dashboardStartup();
    if(currentSelectedProjectId === id) expandProjectDetails(id);
}

function promptDeleteProject(id) {
    document.getElementById('delete-project-id').value = id;
    openModal('modal-eliminar');
}

function confirmDeleteProject() {
    const id = parseInt(document.getElementById('delete-project-id').value);
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    const proj = projects.find(p => p.id === id);

    projects = projects.map(p => p.id === id ? { ...p, status: 'Eliminado' } : p);
    localStorage.setItem('projects', JSON.stringify(projects));
    
    pushTimelineLog(proj.name, 'Cambio de Estado Externo', 'El Líder archivó de manera lógica el proyecto pasando su estado global a Eliminado.', '');

    closeModal();
    dashboardStartup();
    if(currentSelectedProjectId === id) expandProjectDetails(id);
}

function expandProjectDetails(id) {
    currentSelectedProjectId = id;
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const proj = projects.find(p => p.id === id);
    if (!proj) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

    document.getElementById('detail-project-name').innerText = proj.name;
    document.getElementById('detail-project-status').innerText = proj.status;
    document.getElementById('change-project-status-select').value = proj.status;

    const membersList = document.getElementById('detail-members-list');
    membersList.innerHTML = '';
    if(proj.members) {
        proj.members.forEach(m => { membersList.innerHTML += `<li><i class="fa-regular fa-envelope text-red"></i> ${m}</li>`; });
    }

    const photosContainer = document.getElementById('detail-photos-container');
    photosContainer.innerHTML = '';
    if (proj.photos && proj.photos.length > 0) {
        proj.photos.forEach(url => {
            photosContainer.innerHTML += `<img src="${url}" class="evolution-img-thumbnail" style="width:70px; height:70px; object-fit:cover; border-radius:6px; border:1px solid #ddd;">`;
        });
    } else {
        photosContainer.innerHTML = '<small class="text-gray">No hay capturas de evolución.</small>';
    }

    const commentsContainer = document.getElementById('detail-comments-container');
    commentsContainer.innerHTML = '';
    if (proj.comments && proj.comments.length > 0) {
        proj.comments.forEach(c => { commentsContainer.innerHTML += `<p style="font-size:0.85rem; margin-bottom:4px;"><b>${c.user}:</b> ${c.text}</p>`; });
    } else {
        commentsContainer.innerHTML = '<small class="text-gray">Sin anotaciones de diario.</small>';
    }

    const memberActionsDiv = document.querySelector('.btn-action-add-member');
    if (currentUser.role !== 'Lider') {
        if(memberActionsDiv) memberActionsDiv.style.display = 'none';
    } else {
        if(memberActionsDiv) memberActionsDiv.style.display = 'block';
    }

    document.getElementById('project-details-panel').style.display = 'block';
    document.getElementById('project-details-panel').scrollIntoView({ behavior: 'smooth' });
}

function updateProjectStatusState() {
    if (!currentSelectedProjectId) return;
    const selectedState = document.getElementById('change-project-status-select').value;
    
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    const proj = projects.find(p => p.id === currentSelectedProjectId);

    projects = projects.map(p => p.id === currentSelectedProjectId ? { ...p, status: selectedState } : p);
    localStorage.setItem('projects', JSON.stringify(projects));
    
    pushTimelineLog(proj.name, 'Transición de Estado del Ciclo', `Se alteró manualmente el estado interno del proyecto hacia: "${selectedState}".`, '');

    renderProjects();
    expandProjectDetails(currentSelectedProjectId);
}

function addMemberToProject() {
    if (!currentSelectedProjectId) return;
    const emailInput = document.getElementById('add-member-email').value;
    if (!emailInput) return alert("Ingrese un correo.");

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let targetProj = projects.find(p => p.id === currentSelectedProjectId);

    projects = projects.map(p => {
        if (p.id === currentSelectedProjectId) {
            const members = p.members || [];
            if (!members.includes(emailInput)) members.push(emailInput);
            return { ...p, members };
        }
        return p;
    });

    localStorage.setItem('projects', JSON.stringify(projects));
    
    pushTimelineLog(targetProj.name, 'Asignación de Personal', `Se vinculó un nuevo participante institucional (${emailInput}) al proyecto.`, '');

    document.getElementById('add-member-email').value = '';
    expandProjectDetails(currentSelectedProjectId);
}

function uploadProjectPhoto() {
    if (!currentSelectedProjectId) return;
    const url = document.getElementById('project-photo-url').value;
    if (!url) return alert("Inserte una URL.");

    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let targetProj = projects.find(p => p.id === currentSelectedProjectId);

    projects = projects.map(p => {
        if (p.id === currentSelectedProjectId) {
            const photos = p.photos || [];
            photos.push(url);
            return { ...p, photos };
        }
        return p;
    });

    localStorage.setItem('projects', JSON.stringify(projects));
    
    pushTimelineLog(targetProj.name, 'Carga de Evidencia Multimedia', 'Se subió una nueva fotografía representativa al diario de evolución tecnológica del proyecto.', url);

    document.getElementById('project-photo-url').value = '';
    expandProjectDetails(currentSelectedProjectId);
    renderProjects();
}

function addProjectComment() {
    if (!currentSelectedProjectId) return;
    const commentText = document.getElementById('project-comment-text').value;
    if (!commentText) return;

    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { name: 'Anónimo' };
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    
    projects = projects.map(p => {
        if (p.id === currentSelectedProjectId) {
            const comments = p.comments || [];
            comments.push({ user: currentUser.name, text: commentText });
            return { ...p, comments };
        }
        return p;
    });

    localStorage.setItem('projects', JSON.stringify(projects));
    document.getElementById('project-comment-text').value = '';
    expandProjectDetails(currentSelectedProjectId);
}

// ==================== AUTO CONTROL DE SPRINTS SEMESTRALES ====================
function renderSprintsTable() {
    const tbody = document.getElementById('sprints-table-body');
    if (!tbody) return;
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    tbody.innerHTML = '';

    projects.forEach(p => {
        const start = p.startDate ? new Date(p.startDate) : new Date();
        const end = p.endDate ? new Date(p.endDate) : new Date();
        const midTime = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
        
        tbody.innerHTML += `
            <tr>
                <td><b>${p.name}</b></td>
                <td>Sprint 1</td>
                <td>${start.toLocaleDateString('es-CO')} - ${midTime.toLocaleDateString('es-CO')}</td>
                <td><span class="badge gray">Vigente</span></td>
            </tr>
            <tr>
                <td><b>${p.name}</b></td>
                <td>Sprint 2</td>
                <td>${midTime.toLocaleDateString('es-CO')} - ${end.toLocaleDateString('es-CO')}</td>
                <td><span class="badge gray">Planeado</span></td>
            </tr>
        `;
    });
}

// ==================== SECCIÓN DE TAREAS ====================
function populateProjectSelects() {
    const filterSelect = document.getElementById('filter-task-project');
    const modalSelect = document.getElementById('task-project-select');
    const projects = JSON.parse(localStorage.getItem('projects')) || [];

    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">Todos los proyectos</option>';
        projects.forEach(p => { filterSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`; });
    }
    if (modalSelect) {
        modalSelect.innerHTML = '';
        projects.forEach(p => { modalSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`; });
    }
}

function renderTasks() {
    const tbody = document.getElementById('tasks-table-body');
    if (!tbody) return;
    
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const projects = JSON.parse(localStorage.getItem('projects')) || [];
    const filterValue = document.getElementById('filter-task-project') ? document.getElementById('filter-task-project').value : 'all';

    tbody.innerHTML = '';
    const filteredTasks = filterValue === 'all' ? tasks : tasks.filter(t => t.projectId == filterValue);

    filteredTasks.forEach(t => {
        const matchingProject = projects.find(p => p.id == t.projectId);
        const projectName = matchingProject ? matchingProject.name : 'Proyecto Indefinido';
        const badgeColor = t.priority === 'Alta' ? 'red' : 'gray';

        tbody.innerHTML += `
            <tr>
                <td>${t.id}</td>
                <td><small><b>${projectName}</b></small></td>
                <td>${t.name}</td>
                <td>${t.sprint}</td>
                <td>
                    <select class="status-select ${getStatusClass(t.status)}" onchange="updateTaskStatusData(${t.id}, this)">
                        <option value="sin-empezar" ${t.status==='sin-empezar'?'selected':''}>Sin empezar</option>
                        <option value="progreso" ${t.status==='progreso'?'selected':''}>En progreso</option>
                        <option value="completada" ${t.status==='completada'?'selected':''}>Completada</option>
                    </select>
                </td>
                <td><span class="badge ${badgeColor}">${t.priority}</span></td>
                <td><b>${t.assignee}</b></td>
            </tr>
        `;
    });
}

function getStatusClass(status) {
    if (status === 'sin-empezar') return 'status-gray';
    if (status === 'progreso') return 'status-yellow';
    if (status === 'completada') return 'status-green';
    return 'status-gray';
}

function updateTaskStatusData(taskId, selectElement) {
    selectElement.classList.remove("status-gray", "status-yellow", "status-green");
    selectElement.classList.add(getStatusClass(selectElement.value));

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.map(t => t.id === taskId ? { ...t, status: selectElement.value } : t);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function createNewTaskData() {
    const projId = parseInt(document.getElementById('task-project-select').value);
    const name = document.getElementById('task-name').value;
    const sprint = document.getElementById('task-sprint-select').value;
    const priority = document.getElementById('task-priority-select').value;
    const assignee = document.getElementById('task-assignee').value;

    if (!name || !assignee) return alert("Rellene los campos obligatorios.");

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ id: Date.now(), projectId: projId, name, sprint, status: 'sin-empezar', priority, assignee });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    document.getElementById('task-name').value = '';
    document.getElementById('task-assignee').value = '';
    
    closeModal();
    renderTasks();
}

// ==================== DISPARADORES MODAL OVERLAY ====================
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
    document.getElementById('modal-overlay').classList.remove('active');
    document.querySelectorAll('.modal-box').forEach(m => m.classList.remove('active'));
}
