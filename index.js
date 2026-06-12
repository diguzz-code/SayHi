document.addEventListener('DOMContentLoaded', () => {
  // Accende le icone Lucide, per non colori morti
  lucide.createIcons();

  // --- SELETTORI ---
  const sidebar = document.getElementById('sidebar');
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  const btnSidebarClose = document.getElementById('btn-sidebar-close');
  const btnSearchToggle = document.getElementById('btn-search-toggle');
  const searchWidget = document.getElementById('search-widget');
  const searchInput = document.getElementById('search-chats-input');
  const chatListItems = document.getElementById('chat-list-items');
  const btnNewChat = document.getElementById('btn-new-chat');
  const btnClearAll = document.getElementById('btn-clear-all');
  
  const activeChatTitle = document.getElementById('active-chat-title');
  const messagesContainer = document.getElementById('messages-container');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  const typingIndicator = document.getElementById('typing-indicator');
  
  const btnSettings = document.getElementById('btn-settings');
  const btnSettingsClose = document.getElementById('btn-settings-close');
  const settingsModalOverlay = document.getElementById('settings-modal-overlay');
  
  const themeSwitch = document.getElementById('theme-switch');
  const blobMovementSelect = document.getElementById('blob-movement-select');
  const backdrop = document.getElementById('backdrop');
  const accentDots = document.querySelectorAll('.accent-dot');
  
  const btnProfile = document.getElementById('btn-profile');

  // --- STATO APP ---
  let activeChatId = '1';
  let chatCounter = 2; // Parte dall'ultimo data-id gia presente nell'HTML
  let isBotReplying = false;

  const AI_MODELS = ['gpt-5.4-nano', 'gpt-5-nano', 'gemini-2.5-flash-lite'];
  const SYSTEM_PROMPT = [
    'Sei SayHi, un assistente AI integrato in una web app scolastica.',
    'Rispondi sempre in italiano, salvo richiesta diversa dell utente.',
    'Sii utile, chiaro e naturale, con stile simile a ChatGPT.',
    'Se non sei sicuro di un dato recente, dichiaralo e suggerisci una verifica.',
    'Per domande semplici rispondi in modo breve; per richieste complesse struttura la risposta.'
  ].join(' ');

  const conversationTemplates = {
    "Esempio Chatbot": [
      { sender: 'user', text: "Crea un chatbot GPT usando Python, quali sono i passaggi principali?" },
      { sender: 'assistant', text: "Certamente! I passaggi principali sono:\n\n1. **Scegliere il modello AI:** per esempio un modello GPT o un servizio API.\n2. **Preparare l'interfaccia:** una pagina HTML con input utente e area messaggi.\n3. **Scrivere la logica JavaScript:** invio messaggi, cronologia e gestione risposte.\n4. **Collegare il modello:** tramite API o libreria esterna.\n5. **Testare il chatbot:** provando domande diverse e gestendo eventuali errori." },
      { sender: 'user', text: "Quali sono i possibili utilizzi di questo chatbot?" },
      { sender: 'assistant', text: "Un chatbot puo essere usato per:\n\n- **Assistenza utenti:** rispondere a domande frequenti.\n- **Studio:** spiegare argomenti e creare riassunti.\n- **Produttivita:** aiutare a scrivere testi o organizzare idee.\n- **Demo AI:** mostrare una comunicazione domanda-risposta dentro una web app." }
    ],
    "Nuova Conversazione": []
  };

  const conversationStore = {
    '1': [...conversationTemplates["Esempio Chatbot"]],
    '2': [...conversationTemplates["Nuova Conversazione"]]
  };

  // --- FUNZIONI DI SUPPORTO ---

  // Porta la chat in fondo, dove succedono le cose
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Textarea elastica: cresce quando scrivi tanto
  chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight - 10) + 'px';
  });

  // Riattacca gli eventi ai bottoni creati al volo
  //***
  function attachDynamicMessageListeners() {
    // Bottoni copia
    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.onclick = function() {
        const bubble = this.closest('.message-content-container').querySelector('.message-bubble');
        const textToCopy = bubble.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
          const originalHTML = this.innerHTML;
          this.innerHTML = `<i data-lucide="check" style="color: #10b981;"></i> Copiato!`;
          lucide.createIcons();
          setTimeout(() => {
            this.innerHTML = originalHTML;
            lucide.createIcons();
          }, 1500);
        });
      };
    });

    // Bottone modifica: rimette il testo nell'input
    document.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.onclick = function() {
        const bubble = this.closest('.message-content-container').querySelector('.message-bubble');
        chatInput.value = bubble.innerText.trim();
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight - 10) + 'px';
        chatInput.focus();
      };
    });

    // Bottoni rigenera
    document.querySelectorAll('.btn-regenerate').forEach(btn => {
      btn.onclick = function() {
        const lastUserMessage = [...(conversationStore[activeChatId] || [])]
          .reverse()
          .find(message => message.sender === 'user');

        if (!lastUserMessage) {
          triggerBotResponse("Scrivi prima un messaggio, poi posso rigenerare una risposta.");
          return;
        }

        triggerBotResponse(null, true);
      };
    });
  }

  // --- AZIONI SIDEBAR ---

  // Apri/chiudi sidebar
  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
  }

  btnSidebarToggle.addEventListener('click', toggleSidebar);
  btnSidebarClose.addEventListener('click', toggleSidebar);

  // Mostra/nasconde la ricerca nella sidebar
  btnSearchToggle.addEventListener('click', () => {
    searchWidget.classList.toggle('active');
    if (searchWidget.classList.contains('active')) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      filterChats('');
    }
  });

  // Filtra le chat nella sidebar
  searchInput.addEventListener('input', (e) => {
    filterChats(e.target.value);
  });

  function filterChats(query) {
    const items = chatListItems.querySelectorAll('.chat-item');
    const lowerQuery = query.toLowerCase();
    
    items.forEach(item => {
      const title = item.querySelector('.chat-item-title').textContent.toLowerCase();
      if (title.includes(lowerQuery)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  }

  // Cancella tutte le chat
  btnClearAll.addEventListener('click', () => {
    if (confirm("Sei sicuro di voler cancellare tutte le conversazioni?")) {
      Object.keys(conversationStore).forEach(chatId => delete conversationStore[chatId]);
      chatListItems.innerHTML = '<div class="chat-list-divider" style="text-align: center; padding: 20px 0;">Nessuna chat attiva</div>';
      activeChatTitle.textContent = "Chat vuota";
      messagesContainer.innerHTML = `
        <div class="message-wrapper assistant">
          <div class="message-avatar-circle"><i data-lucide="bot"></i></div>
          <div class="message-content-container">
            <div class="message-bubble">
              <p>Tutte le conversazioni sono state cancellate. Crea una <strong>Nuova Chat</strong> per ricominciare!</p>
            </div>
          </div>
        </div>
      `;
      lucide.createIcons();
    }
  });

  // Selezione conversazione
  chatListItems.addEventListener('click', (e) => {
    const chatItem = e.target.closest('.chat-item');
    if (!chatItem) return;

    // Click sul cestino
    if (e.target.closest('.chat-action-btn.delete')) {
      e.stopPropagation();
      deleteChat(chatItem);
      return;
    }

    // Click sulla matita
    if (e.target.closest('.chat-action-btn.edit')) {
      e.stopPropagation();
      renameChat(chatItem);
      return;
    }

    // Carica la chat scelta
    const items = chatListItems.querySelectorAll('.chat-item');
    items.forEach(item => item.classList.remove('active'));
    chatItem.classList.add('active');
    
    activeChatId = chatItem.getAttribute('data-id');
    const title = chatItem.querySelector('.chat-item-title').textContent;
    activeChatTitle.textContent = title;
    
    loadConversationHistory(title);
  });

  // Carica lo storico della chat
  function loadConversationHistory(title) {
    // Svuota la schermata corrente
    messagesContainer.innerHTML = '';
    
    const messages = conversationStore[activeChatId] || conversationTemplates[title] || [
      { sender: 'assistant', text: `Benvenuto nella conversazione **"${title}"**! Come posso esserti utile oggi?` }
    ];

    if (messages.length === 0) {
      appendMessageBubble('assistant', 'Ciao! Sono pronto. Scrivimi una domanda e iniziamo questa nuova conversazione.', false);
    } else {
      messages.forEach(msg => {
        appendMessageBubble(msg.sender, msg.text, false);
      });
    }

    // Rimette l'indicatore di scrittura in fondo
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();
  }

  // Elimina una chat dalla lista
  function deleteChat(chatItem) {
    const isCurrentlyActive = chatItem.classList.contains('active');
    chatItem.style.opacity = '0';
    chatItem.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      delete conversationStore[chatItem.getAttribute('data-id')];
      chatItem.remove();
      // Se era quella aperta, passa alla prossima disponibile
      if (isCurrentlyActive) {
        const remainingItems = chatListItems.querySelectorAll('.chat-item');
        if (remainingItems.length > 0) {
          remainingItems[0].click();
        } else {
          activeChatTitle.textContent = "Nessuna Chat";
          messagesContainer.innerHTML = '<div style="text-align: center; color: var(--text-secondary); margin-top: 50px;">Crea una nuova conversazione per iniziare.</div>';
        }
      }
    }, 250);
  }

  // Rinomina una chat
  function renameChat(chatItem) {
    const titleSpan = chatItem.querySelector('.chat-item-title');
    const currentTitle = titleSpan.textContent;
    const actionsContainer = chatItem.querySelector('.chat-item-actions');
    
    // Nasconde titolo e azioni mentre si scrive il nuovo nome
    titleSpan.style.display = 'none';
    actionsContainer.style.display = 'none';
    
    // Crea l'input direttamente dentro la riga
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-item-edit-input';
    input.value = currentTitle;
    chatItem.insertBefore(input, actionsContainer);
    input.focus();
    input.select();
    
    function saveRename() {
      const newTitle = input.value.trim() || currentTitle;
      input.remove();
      titleSpan.textContent = newTitle;
      titleSpan.style.display = 'block';
      actionsContainer.style.display = 'flex';
      
      // Se e' la chat attiva, aggiorna anche il titolo in alto
      if (chatItem.classList.contains('active')) {
        activeChatTitle.textContent = newTitle;
      }
    }

    input.addEventListener('blur', saveRename);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveRename();
      } else if (e.key === 'Escape') {
        input.value = currentTitle;
        saveRename();
      }
    });
  }

  // Crea nuova chat
  btnNewChat.addEventListener('click', () => {
    chatCounter++;
    const newId = chatCounter.toString();
    const newTitle = `Conversazione #${chatCounter - 2}`;
    
    const newLi = document.createElement('li');
    newLi.className = 'chat-item active';
    newLi.setAttribute('data-id', newId);
    newLi.innerHTML = `
      <span class="chat-item-icon"><i data-lucide="message-square"></i></span>
      <span class="chat-item-title">${newTitle}</span>
      <div class="chat-item-actions">
        <button class="chat-action-btn edit" title="Rename"><i data-lucide="edit-3"></i></button>
        <button class="chat-action-btn delete" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    `;
    
    // Spegne l'attivo dalle altre chat
    document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
    
    // Mette la nuova chat in cima, bella visibile
    const firstItem = chatListItems.firstChild;
    chatListItems.insertBefore(newLi, firstItem);
    
    // Aggiorna intestazione
    activeChatTitle.textContent = newTitle;
    activeChatId = newId;
    conversationStore[activeChatId] = [];
    
    // Schermata pulita per iniziare
    messagesContainer.innerHTML = '';
    appendMessageBubble('assistant', `Ciao! Ho creato questa nuova stanza di chat per te. Puoi personalizzare il titolo cliccando sull'icona della matita a sinistra. Di cosa vogliamo parlare?`, false);
    messagesContainer.appendChild(typingIndicator);
    
    lucide.createIcons();
    scrollToBottom();
  });


  // --- MESSAGGI ---

  // Aggiunge una bolla messaggio nella chat
  function appendMessageBubble(sender, text, shouldStore = true) {
    if (shouldStore) {
      if (!conversationStore[activeChatId]) {
        conversationStore[activeChatId] = [];
      }
      conversationStore[activeChatId].push({ sender, text });
    }

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${sender}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar-circle';
    if (sender === 'user') {
      avatar.textContent = 'U';
    } else {
      avatar.innerHTML = `<i data-lucide="bot"></i>`;
    }
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content-container';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    // Mini parser Markdown, niente di esagerato ma fa il suo
    bubble.innerHTML = parseSimpleMarkdown(text);
    
    contentContainer.appendChild(bubble);
    
    // Azioni sotto al messaggio
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    if (sender === 'user') {
      meta.innerHTML = `<button class="message-meta-btn btn-edit-user"><i data-lucide="edit-2"></i> Modifica</button>`;
    } else {
      meta.innerHTML = `
        <button class="message-meta-btn btn-copy" title="Copia testo"><i data-lucide="copy"></i> Copia</button>
        <button class="message-meta-btn btn-regenerate" style="margin-left: auto;" title="Rigenera risposta"><i data-lucide="refresh-cw"></i> Rigenera</button>
      `;
    }
    contentContainer.appendChild(meta);
    wrapper.appendChild(avatar);
    wrapper.appendChild(contentContainer);
    
    // Inserisce prima dei pallini, se ci sono; altrimenti appende e via
    if (typingIndicator.parentNode === messagesContainer) {
      messagesContainer.insertBefore(wrapper, typingIndicator);
    } else {
      messagesContainer.appendChild(wrapper);
    }
    
    lucide.createIcons();
    attachDynamicMessageListeners();
  }

  // Parser Markdown semplice: titoli, liste, codice e grassetto
  function parseSimpleMarkdown(text) {
    let html = String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    // Grassetto
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Codice inline
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    // Blocchi codice su piu righe
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    // Trasforma gli a capo in paragrafi o br
    html = html.split('\n\n').map(p => {
      // Se sembra una lista, la trasformiamo in lista vera
      if (p.trim().startsWith('- ') || p.trim().startsWith('* ')) {
        const items = p.split('\n').map(li => `<li>${li.replace(/^[-*]\s+/, '')}</li>`).join('');
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s+/.test(p.trim())) {
        const items = p.split('\n').map(li => `<li>${li.replace(/^\d+\.\s+/, '')}</li>`).join('');
        return `<ol>${items}</ol>`;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).join('');
    
    return html;
  }

  function buildAiMessages() {
    const history = conversationStore[activeChatId] || [];
    const recentHistory = history.slice(-12).map(message => ({
      role: message.sender === 'assistant' ? 'assistant' : 'user',
      content: message.text
    }));

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentHistory
    ];
  }

  function extractAiText(response) {
    if (!response) return '';
    if (typeof response === 'string') return response;
    if (typeof response.text === 'string') return response.text;
    if (typeof response.content === 'string') return response.content;
    if (typeof response.output_text === 'string') return response.output_text;

    if (Array.isArray(response.output)) {
      const outputText = response.output
        .map(item => extractAiText(item))
        .filter(Boolean)
        .join('');
      if (outputText) return outputText;
    }

    if (Array.isArray(response.choices)) {
      const choicesText = response.choices
        .map(choice => extractAiText(choice.message || choice.delta || choice))
        .filter(Boolean)
        .join('');
      if (choicesText) return choicesText;
    }

    const content = response.message && response.message.content;
    if (typeof content === 'string') return content;

    if (Array.isArray(content)) {
      return content
        .map(part => {
          if (typeof part === 'string') return part;
          if (typeof part.text === 'string') return part.text;
          if (typeof part.content === 'string') return part.content;
          if (typeof part.value === 'string') return part.value;
          return '';
        })
        .join('');
    }

    if (content && typeof content === 'object') {
      return extractAiText(content);
    }

    return '';
  }

  async function callAiModel() {
    if (!window.puter || !window.puter.ai || typeof window.puter.ai.chat !== 'function') {
      throw new Error('Puter.js non e caricato. Controlla la connessione Internet e ricarica la pagina.');
    }

    const messages = buildAiMessages();
    const errors = [];

    for (const model of AI_MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await window.puter.ai.chat(messages, { model });
          const text = extractAiText(response).trim();

          if (text) {
            return text;
          }

          errors.push(`${model} tentativo ${attempt}: risposta vuota`);
        } catch (error) {
          errors.push(`${model} tentativo ${attempt}: ${error.message || 'errore sconosciuto'}`);
        }
      }
    }

    try {
      const response = await window.puter.ai.chat(messages);
      const text = extractAiText(response).trim();

      if (text) {
        return text;
      }
      errors.push('modello default: risposta vuota');
    } catch (error) {
      errors.push(`modello default: ${error.message || 'errore sconosciuto'}`);
    }

    throw new Error(errors.slice(-3).join(' | '));
  }

  // Simula lo streaming della risposta del bot
  function streamMessage(text, targetChatId = activeChatId, shouldStore = true) {
    typingIndicator.classList.remove('active');
    
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper assistant`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar-circle';
    avatar.innerHTML = `<i data-lucide="bot"></i>`;
    
    const contentContainer = document.createElement('div');
    contentContainer.className = 'message-content-container';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    contentContainer.appendChild(bubble);
    
    // Azioni nascoste finche il bot sta ancora scrivendo
    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.style.display = 'none';
    meta.innerHTML = `
      <button class="message-meta-btn btn-copy" title="Copia testo"><i data-lucide="copy"></i> Copia</button>
      <button class="message-meta-btn btn-regenerate" style="margin-left: auto;" title="Rigenera risposta"><i data-lucide="refresh-cw"></i> Rigenera</button>
    `;
    contentContainer.appendChild(meta);
    wrapper.appendChild(avatar);
    wrapper.appendChild(contentContainer);
    
    if (typingIndicator.parentNode === messagesContainer) {
      messagesContainer.insertBefore(wrapper, typingIndicator);
    } else {
      messagesContainer.appendChild(wrapper);
    }
    lucide.createIcons();
    
    // Effetto scrittura parola per parola
    let currentIdx = 0;
    const words = text.split(' ');
    
    function addWord() {
      if (currentIdx < words.length) {
        bubble.innerHTML = parseSimpleMarkdown(words.slice(0, currentIdx + 1).join(' '));
        currentIdx++;
        scrollToBottom();
        // Velocita un po variabile, cosi sembra meno robotico
        const randomSpeed = Math.floor(Math.random() * 60) + 40; 
        setTimeout(addWord, randomSpeed);
      } else {
        // Fine streaming
        if (shouldStore) {
          if (!conversationStore[targetChatId]) {
            conversationStore[targetChatId] = [];
          }
          conversationStore[targetChatId].push({ sender: 'assistant', text });
        }
        meta.style.display = 'flex';
        isBotReplying = false;
        btnSend.disabled = false;
        scrollToBottom();
        attachDynamicMessageListeners();
      }
    }
    
    addWord();
  }

  // Fa partire la risposta del bot
  async function triggerBotResponse(customText = null, regenerate = false) {
    if (isBotReplying) return;

    isBotReplying = true;
    btnSend.disabled = true;
    typingIndicator.classList.add('active');
    scrollToBottom();
    const responseChatId = activeChatId;

    try {
      if (regenerate && conversationStore[responseChatId]) {
        const lastMessage = conversationStore[responseChatId][conversationStore[responseChatId].length - 1];
        if (lastMessage && lastMessage.sender === 'assistant') {
          conversationStore[responseChatId].pop();
        }
      }

      const responseText = customText || await callAiModel();
      streamMessage(responseText, responseChatId);
    } catch (error) {
      const fallbackText = [
        'Non riesco a contattare il modello AI in questo momento.',
        '',
        `Dettaglio: ${error.message || 'errore sconosciuto'}`,
        '',
        'Controlla la connessione Internet, ricarica la pagina e riprova. L app usa Puter.js come API gratuita/keyless lato frontend.'
      ].join('\n');
      streamMessage(fallbackText, responseChatId, false);
    }
  }

  // Gestisce l'invio del messaggio
  function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text || isBotReplying) return;
    
    // Aggiunge la bolla dell'utente
    appendMessageBubble('user', text);
    
    // Reset dell'input
    chatInput.value = '';
    chatInput.style.height = '24px';
    
    // Tocca al bot rispondere
    triggerBotResponse();
  }

  btnSend.addEventListener('click', handleSendMessage);
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });


  // --- MODALE IMPOSTAZIONI ---
  
  // Mostra modale
  btnSettings.addEventListener('click', () => {
    settingsModalOverlay.classList.add('active');
  });

  // Chiude modale
  function closeSettings() {
    settingsModalOverlay.classList.remove('active');
  }

  btnSettingsClose.addEventListener('click', closeSettings);
  
  settingsModalOverlay.addEventListener('click', (e) => {
    if (e.target === settingsModalOverlay) {
      closeSettings();
    }
  });

  // Switch tema chiaro/scuro
  themeSwitch.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  });

  // Velocita dei blob liquidi
  blobMovementSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    
    // Reset classi
    backdrop.className = 'backdrop-container';
    
    if (value === 'slow') {
      backdrop.classList.add('blobs-slow');
      // Ritocchino inline per animazione lenta
      document.querySelectorAll('.liquid-blob').forEach(blob => {
        blob.style.animationDuration = '60s';
      });
    } else if (value === 'frozen') {
      backdrop.classList.add('blobs-frozen');
    } else {
      // Modalita fluida normale
      document.querySelectorAll('.liquid-blob').forEach(blob => {
        blob.style.animationDuration = '';
      });
    }
  });

  // Scelta colore accento
  accentDots.forEach(dot => {
    dot.addEventListener('click', () => {
      accentDots.forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      
      const color = dot.getAttribute('data-color');
      
      // Aggiorna le variabili CSS globali
      if (color === 'pink') {
        document.documentElement.style.setProperty('--primary', '#d946ef');
        document.documentElement.style.setProperty('--primary-rgb', '217, 70, 239');
        document.documentElement.style.setProperty('--primary-hover', '#c026d3');
        document.documentElement.style.setProperty('--shadow-glow', '0 0 20px rgba(217, 70, 239, 0.25)');
      } else if (color === 'cyan') {
        document.documentElement.style.setProperty('--primary', '#06b6d4');
        document.documentElement.style.setProperty('--primary-rgb', '6, 182, 212');
        document.documentElement.style.setProperty('--primary-hover', '#0891b2');
        document.documentElement.style.setProperty('--shadow-glow', '0 0 20px rgba(6, 182, 212, 0.25)');
      } else if (color === 'emerald') {
        document.documentElement.style.setProperty('--primary', '#10b981');
        document.documentElement.style.setProperty('--primary-rgb', '16, 185, 129');
        document.documentElement.style.setProperty('--primary-hover', '#059669');
        document.documentElement.style.setProperty('--shadow-glow', '0 0 20px rgba(16, 185, 129, 0.25)');
      } else {
        // Indigo di default
        document.documentElement.style.setProperty('--primary', '#6366f1');
        document.documentElement.style.setProperty('--primary-rgb', '99, 102, 241');
        document.documentElement.style.setProperty('--primary-hover', '#4f46e5');
        document.documentElement.style.setProperty('--shadow-glow', '0 0 20px rgba(99, 102, 241, 0.25)');
      }
    });
  });


  // Click profilo: mostra due info al volo
  btnProfile.addEventListener('click', () => {
    alert("Profilo utente: Diego Renesto\nGitHub: https://github.com/diegorenesto\nStato: Piano Gratuito");
  });

  // Aggancia gli eventi ai messaggi gia presenti al caricamento
  attachDynamicMessageListeners();
  scrollToBottom();
});
