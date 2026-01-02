"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellOff, Check, CheckCheck, Trash2, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NotificationsPage() {
  const { notifications, markNotificationAsRead, currentUser } = useStore()
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent")

  const filteredNotifications = notifications
    .filter((n) => {
      if (filter === "unread") return !n.lu
      if (filter === "read") return n.lu
      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortBy === "recent" ? dateB - dateA : dateA - dateB
    })

  const unreadCount = notifications.filter((n) => !n.lu).length

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.lu)
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification.id)
    }
  }

  const getNotificationIcon = (notification: any) => {
    if (notification.lu) {
      return <CheckCheck className="h-5 w-5 text-gray-400" />
    }
    return <Bell className="h-5 w-5 text-blue-600" />
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount > 0 ? (
                    <span className="font-medium text-blue-600">
                      {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                    </span>
                  ) : (
                    "Aucune notification non lue"
                  )}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les notifications</SelectItem>
                  <SelectItem value="unread">Non lues uniquement</SelectItem>
                  <SelectItem value="read">Lues uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récentes</SelectItem>
                  <SelectItem value="oldest">Plus anciennes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Liste des notifications */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {filter === "unread"
                  ? "Aucune notification non lue"
                  : filter === "read"
                  ? "Aucune notification lue"
                  : "Aucune notification"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all ${
                    notification.lu
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-medium ${
                            notification.lu ? "text-gray-700" : "text-gray-900"
                          }`}
                        >
                          {notification.titre}
                        </h3>
                        {!notification.lu && (
                          <Badge className="bg-blue-600 text-white flex-shrink-0">
                            Nouveau
                          </Badge>
                        )}
                      </div>

                      <p
                        className={`text-sm mt-1 ${
                          notification.lu ? "text-gray-500" : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.createdAt)}
                        </span>

                        {!notification.lu && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Marquer comme lu
                          </Button>
                        )}
                      </div>

                      {notification.demande && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Demande: <span className="font-medium">{notification.demande.numero}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
