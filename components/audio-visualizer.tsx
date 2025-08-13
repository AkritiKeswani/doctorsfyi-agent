interface AudioVisualizerProps {
  audioLevel: number
}

export function AudioVisualizer({ audioLevel }: AudioVisualizerProps) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="bg-gradient-to-r from-green-400 to-blue-500 h-full transition-all duration-100 ease-out"
        style={{ width: `${audioLevel * 100}%` }}
      />
    </div>
  )
}
