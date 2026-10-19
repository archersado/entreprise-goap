package com.acme.enterprisegoap.api

import com.acme.enterprisegoap.interview.InterviewSpec
import com.acme.enterprisegoap.model.SemanticGoapModel
import com.acme.enterprisegoap.service.ExecuteRequest
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper

/** Accept raw objects, tool-result wrappers, and JSON-encoded forms from LLM tool calls. */
@Component
class GoapRequestDecoder(private val objectMapper: ObjectMapper) {
    fun interviewSpec(body: JsonNode): InterviewSpec {
        var node = decodeJsonStrings(body)
        if (node.isObject && node.has("spec") && !node.has("id")) {
            node = decodeJsonStrings(node.get("spec"))
        }
        require(node.isObject) { "spec must be a JSON object, spec wrapper, or JSON-encoded object" }
        return decode("InterviewSpec", node, InterviewSpec::class.java)
    }

    fun model(body: JsonNode): SemanticGoapModel {
        var node = decodeJsonStrings(body)
        if (node.isObject && node.has("model") && !node.has("predicates")) {
            node = decodeJsonStrings(node.get("model"))
        }
        require(node.isObject) { "model must be a JSON object, build result, or JSON-encoded object" }
        return decode("model", node, SemanticGoapModel::class.java)
    }

    fun execution(body: JsonNode): ExecuteRequest {
        val request = decodeJsonStrings(body)
        require(request.isObject) { "run request must be a JSON object" }
        val modelNode = request.get("model")
            ?: throw IllegalArgumentException("run request is missing required field 'model'")
        val goalId = request.get("goalId")?.takeIf { it.isString }?.asString()?.takeIf { it.isNotBlank() }
            ?: throw IllegalArgumentException("run request is missing required string field 'goalId'")
        val initialNode = request.get("initialPredicates")
        require(initialNode == null || initialNode.isArray) {
            "run request field 'initialPredicates' must be an array of predicate ids"
        }
        return ExecuteRequest(
            model = model(modelNode),
            goalId = goalId,
            initialPredicates = initialNode?.values()?.map { it.asString() }?.toSet().orEmpty(),
        )
    }

    private fun decodeJsonStrings(input: JsonNode): JsonNode {
        var node = input
        repeat(4) {
            if (!node.isString) return node
            val text = node.asString().trim()
            require(text.isNotEmpty()) { "JSON request must not be blank" }
            node = try {
                objectMapper.readTree(text)
            } catch (exception: Exception) {
                throw IllegalArgumentException("request contains an invalid JSON string: ${exception.message}", exception)
            }
        }
        return node
    }

    private fun <T> decode(label: String, node: JsonNode, type: Class<T>): T = try {
        objectMapper.treeToValue(node, type)
    } catch (exception: Exception) {
        throw IllegalArgumentException("invalid $label request: ${exception.message}", exception)
    }
}
