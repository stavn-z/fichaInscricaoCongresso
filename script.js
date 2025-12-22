// --- VARIÁVEIS GLOBAIS E CONFIGURAÇÕES ---
const EVENT_DATE_STR = '2026-02-14';
const EVENT_DATE = new Date(EVENT_DATE_STR + 'T00:00:00');
const REGISTRATION_VALUE = 200.00;
const ASAAS_PAYMENT_LINK = 'https://www.asaas.com/c/8y324xb3rj14riuc'; 
const ADMIN_PASSWORD = 'safira2026';

const SUPABASE_URL = 'https://qrgspfswrlavvpuqfykz.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZ3NwZnN3cmxhdnZwdXFmeWt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTkwMjksImV4cCI6MjA3OTM5NTAyOX0.dyvwo-lU97_sAyHW5h_yIqVORNzcDHpKdQZV8qXteo0';

// CORREÇÃO AQUI: Mudamos de 'const supabase' para 'const supabaseClient'
// para não conflitar com a biblioteca importada no HTML.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Imagem do QR Code PIX (Base64) ---
const PIX_QR_CODE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABJtizGAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAI5JREFUeJzs2LENg0AMANF26NAO3YAO6NAO3YEO4IAO4IAO4MAuE/gcgQ/79x6GxxHMJgMhISCksQgJISFkJISQkA8SpSREL9kfEkv6S8L/CFkSkhCSkJCQZKUv2R8SS/pLwv8IWRISEpKQlKRkpCwkISEhISEhISEhISEhISEhISEhISEhISEhISEhISEJ+QGdjQwKcL5fTAAAAABJRU5ErkJggg==";


// Array que armazena o estado dos congressistas
let congressistas = [];

// Estado do Comprovante Individual
let individualProofsState = {}; // { congressistaId: {file: File, fileName: 'nome.pdf'}, ... }
let proofsAttachedCount = 0; // Contador numérico

// Estado do método de pagamento
let selectedPaymentMethod = 'pix'; // 'pix' ou 'card'

// Estado universal do responsável legal e do termo
let universalGuardian = {
    name: '',
    cpf: '',
    phone: '',
    email: '',
    termSigned: null, // Data e hora da assinatura única
};


// --- FUNÇÕES DE UTILIDADE ---

/**
 * Gera um ID único simples.
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Calcula se o congressista será menor de 18 anos na data do evento.
 */
function isMinor(dobString) {
    const dob = new Date(dobString + 'T00:00:00'); // Garante que a hora não afete
    if (isNaN(dob.getTime())) return false;

    let age = EVENT_DATE.getFullYear() - dob.getFullYear();
    const monthDiff = EVENT_DATE.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && EVENT_DATE.getDate() < dob.getDate())) {
        age--;
    }
    return age < 18;
}

/**
 * Aplica a máscara no input.
 */
function applyMask(input, mask) {
    function format(value) {
        let i = 0;
        const v = value.replace(/\D/g, '');
        let formattedValue = '';

        for (let j = 0; j < mask.length; j++) {
            if (i >= v.length) break;
            if (mask[j] === '9') {
                formattedValue += v[i];
                i++;
            } else {
                formattedValue += mask[j];
            }
        }
        return formattedValue;
    }

    // Garante que o input handler seja aplicado apenas uma vez
    if (!input.classList.contains('mask-applied')) {
         input.addEventListener('input', (e) => {
            e.target.value = format(e.target.value);
        });
        input.classList.add('mask-applied');
    }
    
    // Aplica a formatação inicial se houver valor
    input.value = format(input.value);
}

// --- FUNÇÕES DE RENDERIZAÇÃO E LÓGICA DE UI ---

/**
 * Renderiza o HTML de um novo congressista.
 */
function createCongressistaHtml(id, index) {
    const title = index === 0 ? "Dados do Congressista Principal" : `Congressista ${index + 1}`;
    const isRemovable = index !== 0;

    return `
        <section id="congressista-${id}" data-id="${id}" class="congressista-card p-6 card-content rounded-2xl card-shadow border-t-4 border-secondary">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-primary">${title}</h2>
                ${isRemovable ? `
                    <button type="button" data-id="${id}" class="remove-congressista-btn p-2 text-accent-error hover:text-red-700 transition rounded-full hover:bg-red-50">
                        <svg class="icon h-6 w-6 stroke-accent-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M14 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                    </button>
                ` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="col-span-full">
                    <label class="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input type="text" data-field="name" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary text-gray-800">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                    <input type="date" data-field="dob" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary text-gray-800">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Telefone</label>
                    <input type="tel" data-field="phone" required maxlength="15" class="phone-mask w-full p-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary text-gray-800">
                </div>
                <div class="col-span-full">
                    <label class="block text-sm font-medium text-gray-700">E-mail</label>
                    <input type="email" data-field="email" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary text-gray-800">
                </div>
            </div>
        </section>
    `;
}

/**
 * Adiciona um novo congressista (ou o primeiro).
 */
function addCongressista() {
    const id = generateId();
    const index = congressistas.length;

    const newCongressista = {
        id: id,
        name: '',
        dob: '',
        phone: '',
        email: '',
        isMinor: false,
        guardian: { name: '', cpf: '', phone: '', email: '' }, 
        termSigned: null,
    };
    congressistas.push(newCongressista);
    // Inicializa o estado do comprovante para este novo congressista
    individualProofsState[id] = null; 

    const container = document.getElementById('congressistas-container');
    container.insertAdjacentHTML('beforeend', createCongressistaHtml(id, index));

    const card = container.lastElementChild;
    setupCardListeners(card, id, index);
    
    updateUniversalGuardianVisibility();
    updatePaymentDetails();
    renderIndividualProofs(); // Rerenderiza a seção de comprovantes
}

/**
 * Remove um congressista.
 */
function removeCongressista(id) {
    const indexToRemove = congressistas.findIndex(c => c.id === id);
    if (indexToRemove > -1 && indexToRemove !== 0) {
        congressistas.splice(indexToRemove, 1);
        document.getElementById(`congressista-${id}`).remove();
        
        // Limpa o estado do comprovante e recalcula
        if(individualProofsState[id]) {
            if (individualProofsState[id].file) {
                proofsAttachedCount--;
            }
            delete individualProofsState[id];
        }

        renumberCongressistas();
        updateUniversalGuardianVisibility();
        updatePaymentDetails();
        renderIndividualProofs(); // Rerenderiza a seção de comprovantes
        showMessageModal('Removido', `Congressista ${indexToRemove + 1} removido com sucesso.`, 'primary');
    }
}

/**
 * Atualiza a numeração e títulos dos congressistas após adição/remoção.
 */
function renumberCongressistas() {
    const cards = document.querySelectorAll('.congressista-card');
    cards.forEach((card, index) => {
        const id = card.getAttribute('data-id');
        const titleElement = card.querySelector('h2');
        const title = index === 0 ? "Dados do Congressista Principal" : `Congressista ${index + 1}`;
        titleElement.textContent = title;
    });
}

/**
 * Configura ouvintes de eventos e máscaras para um novo cartão de congressista.
 */
function setupCardListeners(card, id, index) {
    const congressista = congressistas.find(c => c.id === id);

    // Aplica máscaras
    card.querySelectorAll('.phone-mask').forEach(input => applyMask(input, '(99) 99999-9999'));

    // OUVINTES DE INPUT
    card.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', (e) => handleInputChange(e, id));
    });

    // OUVINTE DOB (Data de Nascimento) para lógica de idade
    const dobInput = card.querySelector('[data-field="dob"]');
    dobInput.addEventListener('change', () => {
        const isMinorResult = isMinor(dobInput.value);
        congressista.isMinor = isMinorResult;
        updateUniversalGuardianVisibility(); 
        updateUniversalTermFields();
        updateSubmitButtonState();
    });

    // OUVINTE DE REMOÇÃO
    card.querySelector('.remove-congressista-btn')?.addEventListener('click', () => removeCongressista(id));
}

/**
 * Lida com a mudança de valor em qualquer input do congressista e atualiza o estado.
 */
function handleInputChange(e, id) {
    const input = e.target;
    const field = input.getAttribute('data-field');
    const value = input.value;
    const congressista = congressistas.find(c => c.id === id);

    if (!congressista) return;

    // Aplica a classe para garantir que o texto seja visível ao digitar
    input.classList.add('text-gray-800');

    congressista[field] = value;

    if (field === 'name') {
        renderIndividualProofs(); // Atualiza o nome no input de comprovante
        updateUniversalTermFields(); // Atualiza lista de nomes no termo
    }
    updateSubmitButtonState();
}

/**
 * Renderiza os inputs de comprovante individuais.
 */
function renderIndividualProofs() {
    const container = document.getElementById('individual-proofs-container');
    container.innerHTML = '';
    
    let attachedCount = 0;

    congressistas.forEach((c, index) => {
        const name = c.name.trim() || `Congressista ${index + 1}`;
        const proofId = `proof-${c.id}`;
        const isAttached = individualProofsState[c.id]?.file ? true : false;
        
        if (isAttached) attachedCount++;

        const statusClass = isAttached ? 'text-accent-success' : 'text-accent-error';
        const statusText = isAttached ? 'ANEXADO' : 'PENDENTE';
        const fileName = individualProofsState[c.id]?.fileName || '';

        // HTML para input individual
        const html = `
            <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span class="text-sm font-medium text-gray-700 w-full sm:w-1/3">Voucher para: ${name}</span>
                <div class="flex-grow w-full">
                    <input type="file" id="${proofId}" required data-congressista-id="${c.id}"
                           class="individual-proof-input block w-full text-sm text-gray-500 
                                  file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 
                                  file:text-sm file:font-semibold file:bg-secondary file:text-white 
                                  hover:file:bg-[#00796b] transition" 
                           accept="image/*,application/pdf">
                    <span class="text-xs text-gray-400 block mt-1 overflow-hidden whitespace-nowrap overflow-ellipsis">${fileName}</span>
                </div>
                <span id="status-${proofId}" class="text-xs font-semibold whitespace-nowrap ${statusClass}">
                    ${statusText}
                </span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
    
    // Atualiza o contador global
    proofsAttachedCount = attachedCount;

    // Re-anexa listeners aos novos inputs
    document.querySelectorAll('.individual-proof-input').forEach(input => {
        input.addEventListener('change', handleIndividualProofChange);
    });

    updateProofStatusDisplay();
}

/**
 * Lida com a mudança de arquivo em um input individual.
 */
function handleIndividualProofChange(e) {
    const input = e.target;
    const id = input.getAttribute('data-congressista-id');
    const statusEl = document.getElementById(`status-${input.id}`);
    const fileNameEl = input.nextElementSibling; // O span que mostra o nome do arquivo
    const file = input.files[0];

    if (file) {
        if (!individualProofsState[id] || !individualProofsState[id].file) {
            proofsAttachedCount++; // Incrementa se estava pendente
        }
        individualProofsState[id] = { file: file, fileName: file.name };
        
        // Atualiza UI
        statusEl.textContent = 'ANEXADO';
        statusEl.classList.remove('text-accent-error');
        statusEl.classList.add('text-accent-success');
        fileNameEl.textContent = file.name;
    } else {
        if (individualProofsState[id] && individualProofsState[id].file) {
            proofsAttachedCount--; // Decrementa se tinha arquivo
        }
        individualProofsState[id] = null;

        // Atualiza UI
        statusEl.textContent = 'PENDENTE';
        statusEl.classList.add('text-accent-error');
        statusEl.classList.remove('text-accent-success');
        fileNameEl.textContent = '';
    }

    updateProofStatusDisplay();
    updateSubmitButtonState();
}

/**
 * Atualiza o display de status dos comprovantes.
 */
function updateProofStatusDisplay() {
    const total = congressistas.length;
    document.getElementById('proof-status-display').textContent = 
        `Status: ${proofsAttachedCount}/${total} Voucher(s) Anexado(s)`;
    
    document.getElementById('proof-label-general').textContent = 
        `Anexar Voucher(s) de Credenciamento (${proofsAttachedCount}/${total})`;
    
    updateSubmitButtonState();
}

/**
 * Atualiza o texto dinâmico do Termo de Autorização.
 */
function updateUniversalTermFields() {
    const minors = congressistas.filter(c => c.isMinor);
    
    // Seletores que buscam os spans dentro do P#universal-term-text
    const respNameEl = document.querySelector('#universal-term-text span:nth-child(1)');
    const respCpfEl = document.querySelector('#universal-term-text span:nth-child(2)');
    const minorsListEl = document.getElementById('minors-list');

    // 1. Atualiza Nome e CPF do Responsável
    if (respNameEl) respNameEl.textContent = universalGuardian.name.trim() || '[NOME DO RESPONSÁVEL]';
    if (respCpfEl) respCpfEl.textContent = universalGuardian.cpf.trim() || '[CPF DO RESPONSÁVEL]';

    // 2. Atualiza Lista de Menores
    if (minorsListEl) {
        minorsListEl.innerHTML = '';
        if (minors.length > 0) {
            const minorNames = minors.map(m => m.name.trim() || `Congressista ${congressistas.findIndex(c => c.id === m.id) + 1}`).join(', ');
            minorsListEl.textContent = minorNames;
        } else {
            minorsListEl.textContent = '[NENHUM MENOR NA FICHA]';
        }
    }
}

/**
 * Verifica se há menores e controla a visibilidade e obrigatoriedade da Seção Universal do Responsável.
 */
function updateUniversalGuardianVisibility() {
    const minorsExist = congressistas.some(c => c.isMinor);
    const section = document.getElementById('universal-guardian-section');
    const requiredInputs = section.querySelectorAll('input'); // Não precisa de [required] aqui

    if (minorsExist) {
        section.classList.remove('hidden');
        requiredInputs.forEach(input => input.setAttribute('required', 'required'));
    } else {
        section.classList.add('hidden');
        requiredInputs.forEach(input => input.removeAttribute('required'));
        // Se não há menores, reseta o estado do responsável
        universalGuardian.name = '';
        universalGuardian.cpf = '';
        universalGuardian.phone = '';
        universalGuardian.email = '';
        universalGuardian.termSigned = null;
        // Reseta os campos de input
        section.querySelectorAll('input').forEach(input => input.value = '');
    }

    updateUniversalTermFields();
    updateSignButtonState();
}

/**
 * Configura os ouvintes de input para a seção do Responsável Legal (universal).
 */
function initUniversalGuardianListeners() {
    const section = document.getElementById('universal-guardian-section');
    
    // Aplica máscaras
    section.querySelectorAll('.phone-mask').forEach(input => applyMask(input, '(99) 99999-9999'));
    section.querySelectorAll('.cpf-mask').forEach(input => applyMask(input, '999.999.999-99'));

    section.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const field = e.target.getAttribute('data-field');
            if (field in universalGuardian) {
                 universalGuardian[field] = e.target.value;
            }

            if (field === 'name' || field === 'cpf') {
                updateUniversalTermFields();
            }
            
            updateSignButtonState();
            updateSubmitButtonState();
        });
    });

    // Listener para Assinatura do Termo
    document.getElementById('sign-term-btn-universal').addEventListener('click', () => {
        if (!document.getElementById('sign-term-btn-universal').disabled) {
            universalGuardian.termSigned = new Date().toISOString();
            document.getElementById('universal-term-status').textContent = 'ASSINADO';
            document.getElementById('universal-term-status').classList.remove('text-accent-error');
            document.getElementById('universal-term-status').classList.add('text-accent-success');
            document.getElementById('universal-signature-date').textContent = `Assinado em: ${new Date().toLocaleString('pt-BR')}`;
            updateSignButtonState();
        }
    });
}


/**
 * Atualiza o estado do botão de assinatura universal e do botão final.
 */
function updateSignButtonState() {
    const minorsExist = congressistas.some(c => c.isMinor);
    const signBtn = document.getElementById('sign-term-btn-universal');
    
    if (!minorsExist) {
         signBtn.disabled = true;
         signBtn.textContent = 'Assinar Termo Digitalmente';
         signBtn.classList.add('disabled:bg-gray-400');
         signBtn.classList.remove('bg-primary', 'hover:bg-secondary', 'bg-accent-success');
         return;
    }

    // Verifica se o CPF tem 14 caracteres (máscara completa)
    const requiredFieldsFilled = universalGuardian.name.trim() && universalGuardian.cpf.length === 14;

    if (universalGuardian.termSigned) {
        signBtn.disabled = true;
        signBtn.textContent = 'Termo Assinado';
        signBtn.classList.remove('bg-primary', 'hover:bg-secondary', 'disabled:bg-gray-400');
        signBtn.classList.add('bg-accent-success', 'disabled:bg-accent-success/80');
    } else if (requiredFieldsFilled) {
        signBtn.disabled = false;
        signBtn.textContent = 'Assinar Termo Digitalmente';
        signBtn.classList.add('bg-primary', 'hover:bg-secondary');
        signBtn.classList.remove('bg-accent-success', 'disabled:bg-gray-400');
    } else { 
        signBtn.disabled = true;
        signBtn.textContent = 'Preencha Nome e CPF p/ Assinar'; // Mensagem mais clara
        signBtn.classList.add('disabled:bg-gray-400');
        signBtn.classList.remove('bg-primary', 'hover:bg-secondary', 'bg-accent-success');
    }
    
    updateSubmitButtonState();
}

/**
 * Atualiza o estado do botão de submissão final.
 */
function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submit-btn');
    const minorsExist = congressistas.some(c => c.isMinor);
    
    // Validações
    const isAllCongressistasFilled = congressistas.every(c => 
        c.name.trim() && c.dob.trim() && c.phone.replace(/\D/g, '').length === 11 && c.email.trim().includes('@')
    );
    
    const isProofCountValid = proofsAttachedCount === congressistas.length && congressistas.length > 0;
    
    // Verifica se o responsável precisa assinar E se os campos obrigatórios estão preenchidos
    const isGuardianDataValid = !minorsExist || (universalGuardian.name.trim() && universalGuardian.cpf.length === 14 && universalGuardian.phone.replace(/\D/g, '').length === 11 && universalGuardian.email.trim().includes('@'));
    // Verifica se o termo precisa ser assinado E se foi assinado
    const isTermSignedValid = !minorsExist || universalGuardian.termSigned;
    
    let reason = "";

    if (!isAllCongressistasFilled) {
        reason = "Preencha todos os campos dos Congressistas.";
    } else if (!isProofCountValid) {
        reason = `Anexe os ${congressistas.length} Voucher(s) de Credenciamento.`;
    } else if (minorsExist && !isGuardianDataValid) {
         reason = "Preencha todos os dados do Responsável Legal.";
    } else if (minorsExist && !isTermSignedValid) {
        reason = "Assine o Termo de Autorização.";
    }
    
    // Atualiza Botão
    if (isAllCongressistasFilled && isProofCountValid && isGuardianDataValid && isTermSignedValid) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50');
        submitBtn.textContent = 'Finalizar Inscrição';
    } else {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50');
        submitBtn.textContent = reason || 'Preencha todos os campos';
    }
    return submitBtn.disabled;
}

// --- FUNÇÕES DE PAGAMENTO E FLUXO ---

/**
 * Lida com o clique no botão de realizar pagamento (inicia a transação).
 */
function handleInitiatePayment() {
    const count = congressistas.length;
    
    let modalMessage = '';

    if (count === 1) {
        modalMessage = `Você será redirecionado para a página de pagamento para pagar o valor da inscrição (R$ 200,00 + taxa de serviço).<br><br>Após pagar, anexe o Voucher e envie ao Líder.`;
    } else {
         modalMessage = `Você será redirecionado para a página de pagamento.<br><br><strong>IMPORTANTE:</strong> Como você está inscrevendo ${count} pessoas, você deverá <strong>repetir este pagamento ${count} vez(es)</strong> (uma para cada) e anexar todos os vouchers.`;
    }
    
    showMessageModal(
        'Redirecionando para Pagamento...',
        modalMessage,
        'primary'
    );
    
    setTimeout(() => {
         window.open(ASAAS_PAYMENT_LINK, '_blank');
    }, 3000);
}

function updatePaymentDetails() {
    const total = congressistas.length * REGISTRATION_VALUE;
    const count = congressistas.length;
    
    // Atualiza Total Estimado
    document.getElementById('payment-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')} (Total) + Taxa de Serviço`;
    
    // --- Dynamic Payment Warning and Button Text ---
    const paymentWarningEl = document.getElementById('payment-warning');
    const cardPaymentWarningEl = document.getElementById('card-payment-warning-multiple'); 
    
    let warningText = '';
    let cardWarningText = '';

    if (count === 1) {
        warningText = `⚠️ <strong>Importante:</strong> Após <strong>realizar o pagamento</strong>, envie o <strong>Voucher</strong> por WhatsApp para o Líder, anexe-o abaixo e clique em "Finalizar Inscrição".`;
        cardWarningText = `Você será redirecionado para o ASAAS para pagar o valor da inscrição.`;
    } else {
        warningText = `⚠️ <strong>Importante:</strong> Você deve realizar <strong>${total} pagamentos individuais</strong> (um para cada congressista). Após pagar, envie todos os <strong>Vouchers</strong> por WhatsApp para o Líder, anexe-os abaixo e clique em "Finalizar Inscrição".`;
        cardWarningText = `Você será redirecionado ao ASAAS. Lembre-se: você deve <strong>repetir este pagamento ${total} vez(es)</strong>, um para cada congressista.`;
    }
    
    paymentWarningEl.innerHTML = warningText;
    if (cardPaymentWarningEl) {
         cardPaymentWarningEl.innerHTML = cardWarningText;
    }

    renderIndividualProofs();
    updateSubmitButtonState();
}

// --- FUNÇÃO DE SUBMISSÃO ---
    
const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Desabilita o botão para evitar cliques duplos
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
        // 1. INSERE A FICHA (como antes)
        // Isso é importante para termos um 'ID da Ficha' para organizar os arquivos.
        const paymentMethod = document.querySelector('.payment-tab-btn.active').dataset.tab;
        const minorsExist = congressistas.some(c => c.isMinor);

        let fichaData = {
            metodo_pagamento: paymentMethod,
            nomes_vouchers: Object.values(individualProofsState).map(p => p?.fileName || '').join(' | '), // Ainda salvamos os nomes para referência
            total_inscritos: congressistas.length,
            ...(minorsExist && {
                resp_nome: universalGuardian.name,
                resp_cpf: universalGuardian.cpf,
                resp_telefone: universalGuardian.phone,
                resp_email: universalGuardian.email,
                termo_assinado_em: universalGuardian.termSigned
            })
        };

        const { data: fichaResult, error: fichaError } = await supabaseClient
            .from('fichas')
            .insert(fichaData)
            .select('id')
            .single();

        if (fichaError) {
            throw fichaError; 
        }

        const novaFichaId = fichaResult.id;

        // Criamos uma lista de "promessas" de upload
        const uploadPromises = congressistas.map(async (c) => {
            const proof = individualProofsState[c.id]; 
            let publicURL = null;

            if (proof && proof.file) {
                const file = proof.file;
                const fileName = proof.fileName;
                const filePath = `${novaFichaId}/${c.name.replace(/ /g, '_')}_${fileName}`;

                const { error: uploadError } = await supabaseClient.storage
                    .from('vouchers') // Nome do seu balde
                    .upload(filePath, file);

                if (uploadError) {
                    console.error(`Erro no upload do arquivo ${fileName}:`, uploadError.message);
                    throw uploadError;
                }

                const { data } = supabaseClient.storage
                    .from('vouchers')
                    .getPublicUrl(filePath);
                
                publicURL = data.publicUrl;
            }

            return {
                ficha_id: novaFichaId, 
                nome_completo: c.name,
                data_nascimento: c.dob,
                telefone: c.phone,
                email: c.email,
                menor_de_idade: c.isMinor,
                voucher_url: publicURL 
            };
        });

        const congressistasData = await Promise.all(uploadPromises);

        const { error: congressistaError } = await supabaseClient
            .from('congressistas')
            .insert(congressistasData);

        if (congressistaError) {
            throw congressistaError; 
        }

        showMessageModal('Inscrição Concluída!', `Sua inscrição (${congressistasData.length} pessoa(s)) foi enviada ao banco de dados com sucesso.`, 'accent-success');
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);

    } catch (error) {
        console.error('Erro ao salvar no Supabase:', error.message);
        showMessageModal('Erro na Inscrição', `Não foi possível salvar sua inscrição. Por favor, tente novamente.<br><small>Erro: ${error.message}</small>`, 'accent-error');
        submitBtn.disabled = false;
        updateSubmitButtonState(); 
    }
};

// --- ADMIN LOGIC ---
let clickCount = 0;
let lastClickTime = 0;

function handleTitleClick() {
    const now = Date.now();
    if (now - lastClickTime < 500) {
        clickCount++;
    } else {
        clickCount = 1;
    }
    lastClickTime = now;

    if (clickCount >= 5) {
        document.getElementById('admin-login-modal').classList.remove('hidden');
        document.getElementById('admin-login-modal').classList.add('flex');
        clickCount = 0; 
        lastClickTime = 0;
    }
}

async function handleAdminLogin() {
    const passwordInput = document.getElementById('admin-password');
    if (passwordInput.value === ADMIN_PASSWORD) {
        document.getElementById('admin-login-modal').classList.remove('flex');
        document.getElementById('admin-login-modal').classList.add('hidden');
        passwordInput.value = '';
        
        // Agora usamos await para esperar o painel carregar os dados
        await renderAdminPanel(); 
        
        document.getElementById('admin-modal').classList.remove('hidden');
        document.getElementById('admin-modal').classList.add('flex');
    } else {
        showMessageModal('Acesso Negado', 'Chave secreta incorreta. Tente novamente.', 'accent-error');
        passwordInput.value = '';
    }
}

async function renderAdminPanel() {
    // 1. Busca os dados do Supabase
    const { data: allRegistrations, error } = await supabaseClient
        .from('congressistas')
        .select(`
            *,
            fichas (
                metodo_pagamento,
                nomes_vouchers,
                total_inscritos,
                resp_nome,
                termo_assinado_em,
                criado_em
            )
        `)
        .order('nome_completo', { ascending: true });

    if (error) {
        showMessageModal('Erro', `Não foi possível carregar dados do admin: ${error.message}`, 'accent-error');
        return;
    }

    // 2. Renderiza a tabela
    const tbody = document.getElementById('admin-table-body');
    tbody.innerHTML = '';
    document.getElementById('admin-count').textContent = allRegistrations.length;

    // Colspan alterado de 8 para 9 para acomodar a nova coluna
    if (allRegistrations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-4 text-center text-gray-500">Nenhuma inscrição encontrada no Supabase.</td></tr>`;
        return;
    }

    allRegistrations.forEach((data, index) => {
        const ficha = data.fichas; 

        const isMinorStatus = data.menor_de_idade ? 'Sim' : 'Não';
        const responsibleName = ficha.resp_nome || 'N/A';
        const termStatus = ficha.termo_assinado_em ? `<span class="text-accent-success">Assinado</span>` : `<span class="text-accent-error">Pendente</span>`;
        const submittedAt = new Date(ficha.criado_em).toLocaleString('pt-BR');
        
        const proofCount = ficha.total_inscritos || 0;
        const proofNames = ficha.nomes_vouchers || 'N/A'; 
        
        const proofDisplay = proofCount > 0 
            ? `<span class="font-semibold text-accent-success">${proofCount} anexo(s)</span><span class="text-xs text-gray-500 block break-all">${proofNames}</span>`
            : `<span class="text-accent-error">0</span>`;

        let voucherLinkHtml = `<span class="text-accent-error">N/A</span>`;
        if (data.voucher_url) {
             voucherLinkHtml = `
                <a href="${data.voucher_url}" target="_blank" download class="text-secondary hover:text-white transition inline-flex items-center gap-1">
                    <svg class="icon h-5 w-5 fill-none stroke-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" x2="12" y1="15" y2="3"/>
                    </svg>
                    Download
                </a>
             `;
        }
        
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-xs text-gray-400">${data.id.substring(0, 8)}...</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${data.nome_completo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${isMinorStatus}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${responsibleName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${termStatus}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${ficha.metodo_pagamento || 'N/A'}</td>
            <td class="px-6 py-4 text-sm">${proofDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${submittedAt}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">${voucherLinkHtml}</td> `;
        tbody.appendChild(row);
    });
}

/**
 * Converte dados do Supabase (congressistas + fichas) para CSV.
 */
function convertToCSV_Supabase(data) {
    const headers = [
        'ID Congressista', 'Nome Completo', 'Data Nasc.', 'Menor', 'Telefone', 'Email',
        'ID Ficha', 'Nome Responsável', 'CPF Responsável', 'Telefone Responsável', 'Email Responsável',
        'Termo Assinado Em', 'Método Pagamento', 'Vouchers Anexados (Nomes)', 'Total Inscritos Ficha', 'Data Inscrição'
];
    
    const csvRows = [headers.join(';')];

    for (const item of data) { // item é um congressista
        const ficha = item.fichas || {}; // Garante que a ficha não seja nula

        const termSignedStr = ficha.termo_assinado_em ? new Date(ficha.termo_assinado_em).toLocaleString('pt-BR') : 'Não Assinado';
        const submissionDateStr = ficha.criado_em ? new Date(ficha.criado_em).toLocaleString('pt-BR') : 'N/A';

        const row = [
            item.id,
            `"${item.nome_completo.replace(/"/g, '""')}"`,
            item.data_nascimento,
            item.menor_de_idade ? 'Sim' : 'Não',
            item.telefone,
            item.email,
            item.voucher_url || '',
            item.ficha_id,
            `"${(ficha.resp_nome || '').replace(/"/g, '""')}"`,
            ficha.resp_cpf || '',
            ficha.resp_telefone || '',
            ficha.resp_email || '',
            termSignedStr,
            ficha.metodo_pagamento || '',
            `"${(ficha.nomes_vouchers || '').replace(/"/g, '""')}"`,
            ficha.total_inscritos || 0,
            submissionDateStr
        ].map(field => String(field).replace(/;/g, ',')); // Usei String(field) para mais segurança
        csvRows.push(row.join(';'));
    }
    return csvRows.join('\n');
}

async function exportToCSV() {
    // 1. Busca os dados do Supabase
    const { data: allRegistrations, error } = await supabaseClient
        .from('congressistas')
        .select(`
            *,
            fichas (
                metodo_pagamento,
                nomes_vouchers,
                total_inscritos,
                resp_nome,
                resp_cpf,
                resp_telefone,
                resp_email,
                termo_assinado_em,
                criado_em
            )
        `);

    if (error || !allRegistrations || allRegistrations.length === 0) {
        showMessageModal('Erro de Exportação', 'Não há dados para exportar ou falha na busca.', 'accent-error');
        return;
    }

    // 2. Converte usando a nova função
    const csvContent = convertToCSV_Supabase(allRegistrations);

    // 3. Cria e baixa o arquivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `inscricoes_jubaczoma26_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showMessageModal('Exportação Concluída', `Dados de ${allRegistrations.length} congressistas exportados para CSV com sucesso!`, 'accent-success');
}


// --- HELPERS E INICIALIZAÇÃO ---
function showMessageModal(title, content, color) {
    const modal = document.getElementById('message-modal');
    modal.querySelector('#modal-title').textContent = title;
    modal.querySelector('#modal-title').className = `text-xl font-bold mb-3 text-${color}`;
    modal.querySelector('#modal-content').innerHTML = content; // Usa innerHTML para processar <strong>
    
    const closeBtn = modal.querySelector('#modal-close-btn');
    closeBtn.className = `px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function initPaymentTabs() {
    const pixBtn = document.getElementById('tab-pix-btn');
    const cardBtn = document.getElementById('tab-card-btn');
    const pixContent = document.getElementById('payment-pix-content');
    const cardContent = document.getElementById('payment-card-content');
    
    const asaasBtn = document.getElementById('initiate-payment-btn');
    if (asaasBtn) {
        asaasBtn.addEventListener('click', handleInitiatePayment);
    }

    pixBtn.addEventListener('click', () => {
        selectedPaymentMethod = 'pix';
        // Estilo Ativo (PIX)
        pixBtn.classList.add('active', 'bg-secondary', 'text-white', 'border-secondary');
        pixBtn.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-200');
        
        // Estilo Inativo (Cartão)
        cardBtn.classList.remove('active', 'bg-secondary', 'text-white', 'border-secondary');
        cardBtn.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-200');
        
        pixContent.classList.remove('hidden');
        cardContent.classList.add('hidden');
        updateSubmitButtonState(); 
    });

    cardBtn.addEventListener('click', () => {
        selectedPaymentMethod = 'cartao';
        // Estilo Ativo (Cartão)
        cardBtn.classList.add('active', 'bg-secondary', 'text-white', 'border-secondary');
        cardBtn.classList.remove('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-200');

        // Estilo Inativo (PIX)
        pixBtn.classList.remove('active', 'bg-secondary', 'text-white', 'border-secondary');
        pixBtn.classList.add('bg-gray-100', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-200');

        cardContent.classList.remove('hidden');
        pixContent.classList.add('hidden');
        updateSubmitButtonState();
    });
    
    // Define o conteúdo inicial
    pixContent.classList.remove('hidden');
    cardContent.classList.add('hidden');
}

// Listener de Fechar Modal
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('modal-close-btn').addEventListener('click', () => {
        document.getElementById('message-modal').classList.remove('flex');
        document.getElementById('message-modal').classList.add('hidden');
    });

    // Inicializa o primeiro congressista
    addCongressista();
    
    // Inicializa ouvintes da seção universal e do pagamento
    initUniversalGuardianListeners();
    initPaymentTabs(); // Inicializa as abas de pagamento
    
    // OUVINTES GLOBAIS
    document.getElementById('add-congressista-btn').addEventListener('click', () => addCongressista());
    document.getElementById('registration-form').addEventListener('submit', handleSubmit);
    
    // ADMIN LOGIC LISTENERS
    document.getElementById('main-title').addEventListener('click', handleTitleClick);
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    document.getElementById('admin-close-btn').addEventListener('click', () => {
        document.getElementById('admin-modal').classList.remove('flex');
        document.getElementById('admin-modal').classList.add('hidden');
    });
    document.getElementById('admin-login-close-btn').addEventListener('click', () => {
        document.getElementById('admin-login-modal').classList.remove('flex');
        document.getElementById('admin-login-modal').classList.add('hidden');
    });
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

    // Inicializa estados
    updatePaymentDetails();
    updateUniversalGuardianVisibility();
    updateSubmitButtonState();
});