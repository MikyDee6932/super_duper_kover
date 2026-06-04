package com.kover.dns

import android.content.Context
import kotlinx.coroutines.runBlocking
import java.io.DataOutputStream
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

class DnsInterceptor(private val context: Context, private val nextDnsProfileId: String) {

    private val blocklist by lazy { BlocklistManager(context) }

    fun intercept(packet: ByteArray): ByteArray? {
        // Parse basic IP/UDP packet
        if (packet.size < 28) return null

        val protocol = packet[9].toInt() and 0xFF
        if (protocol != 17) return null // Not UDP

        val dstPort = ((packet[22].toInt() and 0xFF) shl 8) or (packet[23].toInt() and 0xFF)
        if (dstPort != 53) return null // Not DNS

        val dnsPayload = packet.copyOfRange(28, packet.size)
        val domain = parseDnsQuery(dnsPayload) ?: return null

        return if (blocklist.isBlocked(domain)) {
            buildNxDomainResponse(dnsPayload)
        } else {
            // Forward to NextDNS via DoH
            val response = runBlocking { forwardToNextDns(dnsPayload) }
            response?.let { buildUdpResponse(packet, it) }
        }
    }

    private fun parseDnsQuery(dns: ByteArray): String? {
        return try {
            var i = 12
            val parts = mutableListOf<String>()
            while (i < dns.size) {
                val len = dns[i].toInt() and 0xFF
                if (len == 0) break
                i++
                parts.add(String(dns, i, len))
                i += len
            }
            if (parts.isEmpty()) null else parts.joinToString(".")
        } catch (e: Exception) { null }
    }

    private suspend fun forwardToNextDns(dnsPayload: ByteArray): ByteArray? {
        return try {
            val url = URL("https://dns.nextdns.io/$nextDnsProfileId")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/dns-message")
            conn.setRequestProperty("Accept", "application/dns-message")
            conn.doOutput = true
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            conn.outputStream.write(dnsPayload)
            if (conn.responseCode == 200) conn.inputStream.readBytes() else null
        } catch (e: Exception) { null }
    }

    private fun buildNxDomainResponse(query: ByteArray): ByteArray? {
        if (query.size < 12) return null
        val response = query.copyOf()
        response[2] = 0x81.toByte() // QR=1, Opcode=0, AA=0, TC=0, RD=1
        response[3] = 0x83.toByte() // RA=1, RCODE=3 (NXDOMAIN)
        return response
    }

    private fun buildUdpResponse(originalPacket: ByteArray, dnsResponse: ByteArray): ByteArray {
        // Reconstruct UDP/IP packet with swapped src/dst
        val response = ByteArray(28 + dnsResponse.size)
        // IPv4 header
        response[0] = 0x45
        response[1] = 0x00
        val totalLength = response.size
        response[2] = (totalLength shr 8).toByte()
        response[3] = totalLength.toByte()
        response[8] = 64 // TTL
        response[9] = 17 // UDP
        // Swap src/dst IP
        System.arraycopy(originalPacket, 16, response, 12, 4)
        System.arraycopy(originalPacket, 12, response, 16, 4)
        // UDP header: swap ports
        response[20] = originalPacket[22]; response[21] = originalPacket[23]
        response[22] = originalPacket[20]; response[23] = originalPacket[21]
        val udpLength = 8 + dnsResponse.size
        response[24] = (udpLength shr 8).toByte(); response[25] = udpLength.toByte()
        System.arraycopy(dnsResponse, 0, response, 28, dnsResponse.size)
        return response
    }
}
