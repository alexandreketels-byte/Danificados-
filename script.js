let dados = [];

// 🔹 Carrega o CSV e mostra a data de atualização
fetch("danificados.csv")
  .then(response => {
    const dataArquivo = new Date(response.headers.get("Last-Modified"));
    if (!isNaN(dataArquivo)) {
      const opcoes = {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      };
      document.getElementById("ultimaAtualizacao").textContent =
        "Última atualização: " + dataArquivo.toLocaleString("pt-BR", opcoes);
    }
    return response.text();
  })
  .then(text => {
    const linhas = text.split("\n").slice(1);
    dados = linhas.map(linha => {
      // ✅ Divide CSV corretamente (suporta vírgulas dentro de aspas)
      const partes = linha.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
      if (!partes) return {};

      const [
        pedido, os, fabricante, status, descricao, cod,
        btus, nf_fabricante, liquidacao, setor, fotos, defeito, alerta
      ] = partes.map(v => v.replace(/^"|"$/g, "").trim());

      return {
        pedido, os, fabricante, status, descricao, cod,
        btus, nf_fabricante, liquidacao, setor, fotos, defeito, alerta
      };
    });
  });

// 🔹 Elementos da página
const tbody = document.querySelector("#results tbody");
const inputGeral = document.getElementById("searchGeral");
const sugestoes = document.getElementById("suggestionsGeral");
const contador = document.getElementById("contadorResultados");

// 🔹 Remove acentos para busca
function removerAcentos(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// 🔹 Exibir resultados na tabela
function mostrarResultados(filtrados) {
  const thead = document.querySelector("#results thead");
  const tbody = document.querySelector("#results tbody");

  const oldCountRow = document.querySelector(".count-row");
  if (oldCountRow) oldCountRow.remove();

  tbody.innerHTML = "";

  if (filtrados.length === 0) {
    tbody.innerHTML = "<tr><td colspan='13'>Nenhum resultado encontrado.</td></tr>";
    contador.textContent = "";
    return;
  }

  const countRow = document.createElement("tr");
  countRow.classList.add("count-row");
  countRow.innerHTML = `<th colspan="13" style="text-align:left; color: #ffeb3b;">
    ${filtrados.length} registro${filtrados.length > 1 ? "s" : ""} encontrado${filtrados.length > 1 ? "s" : ""}
  </th>`;
  thead.prepend(countRow);

  filtrados.forEach(d => {
    const fotosTexto = d.fotos || "";
    const fotosFormatado = /sem\s*foto/i.test(fotosTexto)
      ? `<span class="sem-foto">${fotosTexto}</span>`
      : fotosTexto;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.pedido || ""}</td>
      <td>${d.os || ""}</td>
      <td>${d.fabricante || ""}</td>
      <td>${d.status || ""}</td>
      <td>${d.descricao || ""}</td>
      <td>${d.cod || ""}</td>
      <td>${d.btus || ""}</td>
      <td>${d.nf_fabricante || ""}</td>
      <td>${d.liquidacao || ""}</td>
      <td>${d.setor || ""}</td>
      <td>${fotosFormatado}</td>
      <td>${d.defeito || ""}</td>
      <td>${
        d.alerta
          ? /separar/i.test(d.alerta)
            ? `<span class="separar">${d.alerta}</span>`
            : /encerrar/i.test(d.alerta)
              ? `<span class="encerrar">${d.alerta}</span>`
              : d.alerta
          : ""
      }</td>
    `;
    tbody.appendChild(tr);
  });

  contador.textContent = `${filtrados.length} registro${filtrados.length > 1 ? "s" : ""} encontrado${filtrados.length > 1 ? "s" : ""}`;
}

// 🔹 Busca exata
function buscar(termo) {
  const termoNormalizado = removerAcentos(termo.trim().toLowerCase());
  const filtrados = dados.filter(d =>
    Object.values(d).some(v => removerAcentos(v?.toLowerCase() || "") === termoNormalizado)
  );
  mostrarResultados(filtrados);
}

// 🔹 Sugestões automáticas
inputGeral.addEventListener("input", () => {
  const termo = inputGeral.value.trim().toLowerCase();
  const termoNormalizado = removerAcentos(termo);
  sugestoes.innerHTML = "";
  if (termo.length < 2) return;

  const combinados = dados.flatMap(d => Object.values(d));
  const unicos = [...new Set(
    combinados.filter(v => removerAcentos(v?.toLowerCase() || "").includes(termoNormalizado))
  )];

  unicos.slice(0, 5).forEach(valor => {
    const li = document.createElement("li");
    li.textContent = valor;
    li.onclick = () => {
      inputGeral.value = valor;
      sugestoes.innerHTML = "";
      buscar(valor);
    };
    sugestoes.appendChild(li);
  });
});

// 🔹 Enter → buscar
inputGeral.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    sugestoes.innerHTML = "";
    buscar(inputGeral.value);
  }
});

// 🔹 Fecha sugestões ao clicar fora
document.addEventListener("click", e => {
  if (!sugestoes.contains(e.target) && e.target !== inputGeral) {
    sugestoes.innerHTML = "";
  }
});

// 🔹 Botão para acessar encerrados
document.getElementById("btnEncerrados").addEventListener("click", () => {
  window.location.href = "encerrados.html";
});
