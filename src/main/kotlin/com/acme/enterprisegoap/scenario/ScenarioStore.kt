package com.acme.enterprisegoap.scenario

import com.acme.enterprisegoap.compiler.CompiledAgentSummary
import com.acme.enterprisegoap.interview.InterviewSpec
import com.acme.enterprisegoap.interview.InterviewSpecStatus
import com.acme.enterprisegoap.interview.SpecBuildResult
import com.acme.enterprisegoap.interview.SpecReviewResult
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.runtime.RunResult
import com.acme.enterprisegoap.validation.ValidationResult
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import tools.jackson.databind.ObjectMapper
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.Path
import java.nio.file.StandardCopyOption
import java.time.Instant
import java.util.UUID

data class ScenarioVersion(
    val version: Int,
    val spec: InterviewSpec,
    val review: SpecReviewResult,
    val model: SemanticGoapModel? = null,
    val validation: ValidationResult? = null,
    val compiled: CompiledAgentSummary? = null,
    val runs: List<RunResult> = emptyList(),
    val changeSummary: String = "",
    val createdBySessionId: String? = null,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
)

data class ScenarioDocument(
    val id: String,
    val title: String,
    val description: String = "",
    val boundSessionIds: Set<String> = emptySet(),
    val versions: List<ScenarioVersion> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
)

data class ScenarioSummary(
    val id: String,
    val title: String,
    val description: String,
    val latestVersion: Int?,
    val status: InterviewSpecStatus?,
    val boundSessionIds: Set<String>,
    val updatedAt: Instant,
)

data class CreateScenarioRequest(
    val title: String,
    val description: String = "",
    val sessionId: String? = null,
)

data class BindScenarioRequest(val sessionId: String)

data class ScenarioSessionRequest(val sessionId: String)

data class CreateScenarioVersionRequest(
    val spec: InterviewSpec,
    val sessionId: String? = null,
    val baseVersion: Int? = null,
    val changeSummary: String = "GUI edit",
    val preserveStatus: Boolean = false,
)

@Component
class ScenarioStore(
    private val objectMapper: ObjectMapper,
    @Value("\${goap.scenario-store-dir:.goap-data/scenarios}") storeDir: String,
) {
    private val root: Path = Path.of(storeDir).toAbsolutePath().normalize()

    init {
        Files.createDirectories(root)
    }

    @Synchronized
    fun list(): List<ScenarioSummary> = Files.list(root).use { paths ->
        paths.filter { it.fileName.toString().endsWith(".json") }
            .map(::read)
            .map(::summary)
            .sorted(compareByDescending<ScenarioSummary> { it.updatedAt })
            .toList()
    }

    @Synchronized
    fun get(id: String): ScenarioDocument = read(pathFor(id))

    @Synchronized
    fun create(request: CreateScenarioRequest): ScenarioDocument {
        require(request.title.isNotBlank()) { "scenario title is required" }
        val id = uniqueId(slug(request.title))
        val now = Instant.now()
        val document = ScenarioDocument(
            id = id,
            title = request.title.trim(),
            description = request.description.trim(),
            boundSessionIds = request.sessionId?.takeIf(String::isNotBlank)?.let(::setOf).orEmpty(),
            createdAt = now,
            updatedAt = now,
        )
        write(document)
        return document
    }

    @Synchronized
    fun bind(id: String, sessionId: String): ScenarioDocument {
        require(sessionId.isNotBlank()) { "sessionId is required" }
        unbindSession(sessionId, except = id)
        val current = get(id)
        val next = current.copy(boundSessionIds = current.boundSessionIds + sessionId, updatedAt = Instant.now())
        write(next)
        return next
    }

    @Synchronized
    fun selectedForSession(sessionId: String): ScenarioDocument? = allDocuments()
        .firstOrNull { sessionId in it.boundSessionIds }

    @Synchronized
    fun createVersion(
        id: String,
        request: CreateScenarioVersionRequest,
        reviewer: (InterviewSpec) -> SpecReviewResult,
    ): ScenarioDocument {
        val current = get(id)
        request.baseVersion?.let { expected ->
            require(current.versions.any { it.version == expected }) { "base version $expected does not exist" }
        }
        val nextVersion = (current.versions.maxOfOrNull { it.version } ?: 0) + 1
        val normalized = request.spec.copy(
            id = request.spec.id.ifBlank { id },
            version = nextVersion,
            status = if (request.preserveStatus) request.spec.status else InterviewSpecStatus.DRAFT,
        )
        val review = reviewer(normalized)
        val now = Instant.now()
        val next = current.copy(
            title = normalized.title.ifBlank { current.title },
            description = normalized.summary.ifBlank { current.description },
            boundSessionIds = current.boundSessionIds + request.sessionId?.takeIf(String::isNotBlank).orEmpty(),
            versions = current.versions + ScenarioVersion(
                version = nextVersion,
                spec = normalized,
                review = review,
                changeSummary = request.changeSummary,
                createdBySessionId = request.sessionId,
                createdAt = now,
                updatedAt = now,
            ),
            updatedAt = now,
        )
        request.sessionId?.takeIf(String::isNotBlank)?.let { unbindSession(it, except = id) }
        write(next)
        return next
    }

    @Synchronized
    fun reviewAndSave(
        spec: InterviewSpec,
        scenarioId: String?,
        sessionId: String?,
        reviewer: (InterviewSpec) -> SpecReviewResult,
    ): SpecReviewResult {
        val current = resolve(scenarioId, sessionId, spec)
        val latest = current.versions.maxByOrNull { it.version }
        if (latest != null && latest.spec == spec) return latest.review
        val normalized = spec.copy(
            id = spec.id.ifBlank { current.id },
            version = maxOf(spec.version, (latest?.version ?: 0) + 1),
        )
        val review = reviewer(normalized)
        val now = Instant.now()
        val next = current.copy(
            title = normalized.title.ifBlank { current.title },
            description = normalized.summary.ifBlank { current.description },
            boundSessionIds = current.boundSessionIds + sessionId?.takeIf(String::isNotBlank).orEmpty(),
            versions = current.versions + ScenarioVersion(
                version = normalized.version,
                spec = normalized,
                review = review,
                changeSummary = if (latest == null) "Initial interview draft" else "Interview update",
                createdBySessionId = sessionId,
                createdAt = now,
                updatedAt = now,
            ),
            updatedAt = now,
        )
        sessionId?.takeIf(String::isNotBlank)?.let { unbindSession(it, except = current.id) }
        write(next)
        return review
    }

    @Synchronized
    fun saveBuild(build: SpecBuildResult, sessionId: String?, scenarioId: String?) {
        updateVersion(build.spec.id, build.spec.version, sessionId, scenarioId) {
            it.copy(spec = build.spec, review = build.review, model = build.model, updatedAt = Instant.now())
        }
    }

    @Synchronized
    fun saveValidation(model: SemanticGoapModel, value: ValidationResult, sessionId: String?) {
        updateVersion(model.id, model.version, sessionId, null) { it.copy(model = model, validation = value, updatedAt = Instant.now()) }
    }

    @Synchronized
    fun saveCompilation(model: SemanticGoapModel, value: CompiledAgentSummary, sessionId: String?) {
        updateVersion(model.id, model.version, sessionId, null) { it.copy(model = model, compiled = value, updatedAt = Instant.now()) }
    }

    @Synchronized
    fun saveRun(model: SemanticGoapModel, value: RunResult, sessionId: String?) {
        updateVersion(model.id, model.version, sessionId, null) { it.copy(model = model, runs = it.runs + value, updatedAt = Instant.now()) }
    }

    private fun updateVersion(
        modelId: String,
        version: Int,
        sessionId: String?,
        scenarioId: String?,
        transform: (ScenarioVersion) -> ScenarioVersion,
    ) {
        val current = scenarioId?.takeIf(String::isNotBlank)?.let { get(it) }
            ?: sessionId?.takeIf(String::isNotBlank)?.let(::selectedForSession)
            ?: allDocuments().firstOrNull { document -> document.versions.any { it.spec.id == modelId } }
            ?: return
        val target = current.versions.indexOfFirst { it.spec.id == modelId && it.version == version }
            .takeIf { it >= 0 } ?: current.versions.indexOfLast { it.spec.id == modelId }.takeIf { it >= 0 } ?: return
        val versions = current.versions.toMutableList()
        versions[target] = transform(versions[target])
        write(current.copy(versions = versions, updatedAt = Instant.now()))
    }

    private fun resolve(scenarioId: String?, sessionId: String?, spec: InterviewSpec): ScenarioDocument {
        scenarioId?.takeIf(String::isNotBlank)?.let { return get(it) }
        sessionId?.takeIf(String::isNotBlank)?.let(::selectedForSession)?.let { return it }
        allDocuments().firstOrNull { document -> document.versions.any { it.spec.id == spec.id } }?.let { return it }
        val title = spec.title.ifBlank { "Untitled GOAP scenario" }
        return create(CreateScenarioRequest(title, spec.summary, sessionId))
    }

    private fun unbindSession(sessionId: String, except: String) {
        allDocuments().filter { it.id != except && sessionId in it.boundSessionIds }.forEach { document ->
            write(document.copy(boundSessionIds = document.boundSessionIds - sessionId, updatedAt = Instant.now()))
        }
    }

    private fun allDocuments(): List<ScenarioDocument> = Files.list(root).use { paths ->
        paths.filter { it.fileName.toString().endsWith(".json") }.map(::read).toList()
    }

    private fun summary(document: ScenarioDocument): ScenarioSummary {
        val latest = document.versions.maxByOrNull { it.version }
        return ScenarioSummary(
            id = document.id,
            title = document.title,
            description = document.description,
            latestVersion = latest?.version,
            status = latest?.spec?.status,
            boundSessionIds = document.boundSessionIds,
            updatedAt = document.updatedAt,
        )
    }

    private fun uniqueId(seed: String): String {
        val base = seed.ifBlank { "scenario" }
        var candidate = base
        while (Files.exists(pathFor(candidate))) candidate = "$base-${UUID.randomUUID().toString().take(8)}"
        return candidate
    }

    private fun slug(value: String): String = value.lowercase()
        .replace(Regex("[^a-z0-9\\p{L}]+"), "-")
        .trim('-')
        .take(64)

    private fun pathFor(id: String): Path {
        require(id.matches(Regex("[a-zA-Z0-9\\p{L}._-]+"))) { "invalid scenario id" }
        return root.resolve("$id.json")
    }

    private fun read(path: Path): ScenarioDocument {
        require(Files.exists(path)) { "scenario not found: ${path.fileName.toString().removeSuffix(".json")}" }
        return objectMapper.readValue(path.toFile(), ScenarioDocument::class.java)
    }

    private fun write(document: ScenarioDocument) {
        val target = pathFor(document.id)
        val temporary = Files.createTempFile(root, ".${document.id}-", ".tmp")
        objectMapper.writeValue(temporary.toFile(), document)
        try {
            Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(temporary, target, StandardCopyOption.REPLACE_EXISTING)
        }
    }
}
